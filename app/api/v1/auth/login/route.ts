import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/server-supabase';
import { buildAuthProfile } from '@/lib/auth-profile';
import { setCurrentAccessTokenHash } from '@/lib/auth-session';

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
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    } as any);

    if (error) {
      return NextResponse.json({ error: error.message || 'Invalid credentials' }, { status: 401 });
    }

    if (data?.user && data.session?.access_token) {
      await setCurrentAccessTokenHash(data.user.id, data.session.access_token);
    }

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
    return NextResponse.json({ error: err?.message || 'Login error' }, { status: 500 });
  }
}
