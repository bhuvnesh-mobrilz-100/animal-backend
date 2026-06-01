import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/server-supabase';
import { buildAuthProfile, PUBLIC_SIGNUP_ROLE_NAMES } from '@/lib/auth-profile';
import { setCurrentAccessTokenHash } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, roleName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    return handleSignup(email, password, roleName || 'Subscriber');
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Signup failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

async function handleSignup(email: string, password: string, roleName: string = 'Subscriber') {
  try {
    if (!PUBLIC_SIGNUP_ROLE_NAMES.includes(roleName as any)) {
      return NextResponse.json({ error: 'Selected role is not available for public signup' }, { status: 400 });
    }

    // Create user via Supabase admin or client signUp
    const { data, error } = await supabaseAdmin.auth.admin.createUser?.({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        roleName,
      },
    } as any) ?? await supabaseAdmin.auth.signUp({ email, password } as any);

    if ((error as any) || !data) {
      const err = (error as any) || { message: 'Unable to create user' };
      return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 400 });
    }

    const createdUser = (data as any)?.user ?? (data as any);
    const userId = createdUser?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: 'User creation returned no user id' }, { status: 400 });
    }

    // Insert internal user record if table exists
    let internalUserId: string | number | null = null;
    try {
      const { data: internalUser, error: internalUserError } = await supabaseAdmin
        .from('users')
        .insert([{ auth_user_id: userId, email, user_type: roleName }])
        .select('user_id')
        .single();

      if (internalUserError) {
        throw internalUserError;
      }

      internalUserId = internalUser?.user_id ?? null;
    } catch (e) {
      console.error('Insert internal user failed', e);
    }

    if (!internalUserId) {
      try {
        const existingUser = await supabaseAdmin
          .from('users')
          .select('user_id')
          .or(`auth_user_id.eq.${userId},email.eq.${email}`)
          .maybeSingle();

        internalUserId = existingUser.data?.user_id ?? null;
      } catch (e) {
        console.error('Lookup internal user failed', e);
      }
    }

    // Attach role if roles table exists
    try {
      const roleQuery = await supabaseAdmin.from('roles').select('role_id').eq('name', roleName).maybeSingle();
      const roleId = roleQuery.data?.role_id ?? null;
      if (roleId && internalUserId) {
        await supabaseAdmin.from('user_roles').upsert(
          [{ user_id: internalUserId, role_id: roleId }],
          { onConflict: 'user_id,role_id' }
        );
      }
    } catch (e) {
      console.error('Assign role failed', e);
    }

    // Try to provide a session to the client. If the creation path didn't return
    // a session (e.g. admin.createUser), attempt to sign in to obtain one.
    let session = (data as any)?.session ?? null;
    if (!session) {
      try {
        const login = await supabaseAdmin.auth.signInWithPassword({ email, password } as any);
        session = login.data?.session ?? null;
      } catch (e) {
        // ignore login failure; session will remain null
      }
    }

    const authProfile = await buildAuthProfile({
      id: userId,
      email,
      roleNames: [roleName],
    });

    if (session?.access_token) {
      await setCurrentAccessTokenHash(userId, session.access_token);
    }

    return NextResponse.json(
      { user: (data as any).user ?? null, session, ...authProfile },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Signup error' }, { status: 500 });
  }
}
