import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/server-supabase';
import { buildAuthProfile, PUBLIC_SIGNUP_ROLE_NAMES } from '@/lib/auth-profile';
import { setCurrentAccessTokenHash } from '@/lib/auth-session';

// ----------------------------------------------------------------------
// Geocoding helper using Google Maps Geocoding API
// ----------------------------------------------------------------------
async function geocodeLocation(location: string): Promise<{ latitude: number | null; longitude: number | null }> {
  if (!location || location.trim() === '') {
    return { latitude: null, longitude: null };
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API;
  if (!apiKey) {
    console.error('Google Maps API key is missing');
    return { latitude: null, longitude: null };
  }

  try {
    const encodedAddress = encodeURIComponent(location.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      console.warn(`Geocoding failed for "${location}": ${data.status} - ${data.error_message || ''}`);
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    console.error('Google Geocoding request error:', error);
    return { latitude: null, longitude: null };
  }
}

// ----------------------------------------------------------------------
// Validation helpers
// ----------------------------------------------------------------------
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

// ----------------------------------------------------------------------
// POST handler – accepts FormData
// ----------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const email = formData.get('email')?.toString() || '';
    const usernameInput = formData.get('username')?.toString() || '';
    const password = formData.get('password')?.toString() || '';
    const confirm_password = formData.get('confirm_password')?.toString() || '';
    const full_name = formData.get('full_name')?.toString() || '';
    const location = formData.get('location')?.toString() || undefined;
    const profile_image_url = formData.get('profile_image_url')?.toString() || undefined;
    const roleName = formData.get('roleName')?.toString() || 'Guest';

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    if (password !== confirm_password) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    return handleSignup(
      email,
      usernameInput,
      password,
      full_name,
      location,
      profile_image_url,
      roleName
    );
  } catch (error: any) {
    console.error('Signup POST error:', error);
    return NextResponse.json({ error: 'Signup failed. Please try again later.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// ----------------------------------------------------------------------
// Core signup logic
// ----------------------------------------------------------------------
async function handleSignup(
  email: string,
  usernameInput: string,
  password: string,
  fullName: string,
  location: string | undefined,
  profileImageUrl: string | undefined,
  roleName: string = 'Guest'
) {
  // 1. Validate required fields
  if (!fullName || fullName.trim() === '') {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  // 2. Split full_name into name and surname
  const nameParts = fullName.trim().split(/\s+/);
  const name = nameParts[0];
  const surname = nameParts.slice(1).join(' ') || '';

  // Derive user_name: use provided if non-empty, else from email prefix
  const finalUsername = usernameInput && usernameInput.trim() !== ''
    ? usernameInput.trim()
    : email.split('@')[0];

  // 3. Geocode location
  const { latitude, longitude } = await geocodeLocation(location || '');
  const staticLocation = location?.trim() || null;

  // 4. Check allowed roles
  if (!PUBLIC_SIGNUP_ROLE_NAMES.includes(roleName as any)) {
    return NextResponse.json(
      { error: 'Selected role is not available for public signup' },
      { status: 400 }
    );
  }

  // 5. Create user in Supabase Auth
  let result;
  let error;
  try {
    const userMetadata = {
      roleName,
      name,
      surname,
      user_name: finalUsername,
      full_name: fullName,
      profile_image_url: profileImageUrl,
    };

    if (supabaseAdmin.auth.admin?.createUser) {
      result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      error = result.error;
    } else {
      const signUpResult = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
        },
      });
      result = signUpResult;
      error = signUpResult.error;
    }
  } catch (err: any) {
    console.error('Auth user creation failed:', err);
    return NextResponse.json({ error: 'Unable to create user. Please try again.' }, { status: 400 });
  }

  if (error || !result?.data) {
    const errMsg = error?.message || 'User creation failed';
    console.error('Auth error:', errMsg);
    return NextResponse.json({ error: 'Signup failed. Email might already exist.' }, { status: 400 });
  }

  const createdUser = result.data.user ?? result.data;
  const userId = createdUser?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User creation returned no user id' }, { status: 400 });
  }

  // 6. Insert into public.users
  let internalUserId: number | null = null;
  try {
    const { data: internalUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: userId,
        email,
        user_name: finalUsername,
        name,
        surname,
        profile_image_url: profileImageUrl || null,
        user_type: roleName,
        static_location: staticLocation,
        latitude,
        longitude,
        subscription_status: 'guest',
        is_verified: true,
        notification_preferences: { events: true, warnings: true, updates: true },
      })
      .select('user_id')
      .single();

    if (insertError) throw insertError;
    internalUserId = internalUser?.user_id;
  } catch (err) {
    console.error('Failed to insert internal user:', err);
    // Attempt to look up existing record (in case insert failed due to duplicate)
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();
    internalUserId = existing?.user_id ?? null;
  }

  if (!internalUserId) {
    console.warn('No internal user_id found for', userId);
    // Non-critical, continue
  }

  // 7. Assign role (if roles table exists)
  try {
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('role_id')
      .eq('name', roleName)
      .maybeSingle();
    if (role?.role_id && internalUserId) {
      await supabaseAdmin.from('user_roles').upsert(
        [{ user_id: internalUserId, role_id: role.role_id }],
        { onConflict: 'user_id,role_id' }
      );
    }
  } catch (err) {
    console.error('Role assignment failed:', err);
    // Non-critical, continue
  }

  // 8. Obtain session and store token hash
  let session = result.data.session ?? null;
  if (!session) {
    try {
      const login = await supabaseAdmin.auth.signInWithPassword({ email, password });
      session = login.data.session ?? null;
    } catch (err) {
      console.warn('Could not create session after signup:', err);
    }
  }
  if (session?.access_token) {
    await setCurrentAccessTokenHash(userId, session.access_token);
  }

  // 9. Build auth profile
  const authProfile = await buildAuthProfile({
    id: userId,
    email,
    roleNames: [roleName],
  });

  return NextResponse.json(
    { user: createdUser, session, ...authProfile },
    { status: 201 }
  );
}