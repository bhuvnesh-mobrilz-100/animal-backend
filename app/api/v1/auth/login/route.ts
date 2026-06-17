import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/server-supabase';
import { buildAuthProfile } from '@/lib/auth-profile';
import { setCurrentTokenHashes } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    return handleLogin(email, password);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

async function handleLogin(email: string, password: string) {
  try {
    // 1. First check if user exists in auth.users (optional, but helps debugging)
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users') // assuming you have a 'users' table linking auth_user_id
      .select('auth_user_id, email, is_verified')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      console.warn(`Login attempt for non-existent email: ${email}`);
      // Return generic error for security
      return NextResponse.json({ error: 'Invalid login credentials' }, { status: 401 });
    }

    // 2. Attempt sign in
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log detailed error for debugging (but don't expose to client)
      console.error('SignIn error:', error.message, error.status);
      return NextResponse.json({ error: 'Invalid login credentials' }, { status: 401 });
    }

    if (data?.user && data.session?.access_token && data.session?.refresh_token) {
      // Set auth_user_id on the internal user record if not already set (e.g. seed users)
      await supabaseAdmin
        .from('users')
        .update({ auth_user_id: data.user.id })
        .eq('email', email)
        .is('auth_user_id', null);

      await setCurrentTokenHashes(data.user.id, data.session.access_token, data.session.refresh_token);
    }

    // 3. Build auth profile – same as before
    const authProfile = data?.user
      ? await buildAuthProfile({
          id: data.user.id,
          email: data.user.email ?? email,
          roleNames: [
            data.user.user_metadata?.roleName,
            data.user.user_metadata?.role_name,
            ...(data.user.user_metadata?.roleNames || []),
            ...(data.user.user_metadata?.role_names || []),
            data.user.app_metadata?.roleName,
            data.user.app_metadata?.role_name,
            ...(data.user.app_metadata?.roleNames || []),
            ...(data.user.app_metadata?.role_names || []),
          ].filter(Boolean) as string[],
        })
      : null;

    return NextResponse.json(
      { user: data?.user ?? null, session: data?.session ?? null, ...authProfile },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Login exception:', err);
    return NextResponse.json({ error: 'Login error' }, { status: 500 });
  }
}
