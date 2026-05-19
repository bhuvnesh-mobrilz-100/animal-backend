import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserByAuthId, getRolesAndPermissionsForUserId } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (!data.user) {
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }

  const { data: userProfile, error: profileError } = await getUserByAuthId(data.user.id);
  if (profileError || !userProfile) {
    return NextResponse.json({ error: profileError?.message || 'User profile not found' }, { status: 404 });
  }

  const { roles, permissions } = await getRolesAndPermissionsForUserId(userProfile.user_id);

  return NextResponse.json({
    user: data.user,
    profile: userProfile,
    session: data.session,
    roles,
    permissions,
  });
}
