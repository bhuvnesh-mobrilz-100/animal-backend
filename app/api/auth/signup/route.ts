import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { assignRolesToUser, getRolesAndPermissionsForUserId } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name, role_ids } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const finalRoleIds = Array.isArray(role_ids)
    ? role_ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
    : typeof role_ids === 'string'
    ? role_ids.split(',').map((id) => Number(id.trim())).filter((id) => !Number.isNaN(id))
    : typeof role_ids === 'number'
    ? [role_ids]
    : [];

  if (finalRoleIds.length === 0) {
    return NextResponse.json({ error: 'Role selection is required during signup' }, { status: 400 });
  }

  const { data, error } = await supabaseServer.auth.signUp({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
  }

  const { data: insertedUser, error: userInsertError } = await supabaseServer.from('users').insert({
    email,
    auth_user_id: data.user.id,
    device_type: 'Web',
    name: name ?? null,
  }).select('user_id').single();

  if (userInsertError || !insertedUser) {
    return NextResponse.json({ error: userInsertError?.message || 'Failed to save user profile' }, { status: 500 });
  }

  const { error: assignError } = await assignRolesToUser(insertedUser.user_id, finalRoleIds as number[]);
  if (assignError) {
    return NextResponse.json({ error: typeof assignError === 'string' ? assignError : assignError.message || 'Failed to assign role' }, { status: 500 });
  }

  const { roles, permissions } = await getRolesAndPermissionsForUserId(insertedUser.user_id);

  return NextResponse.json({
    user: data.user,
    session: data.session,
    profile: insertedUser,
    roles,
    permissions,
  });
}
