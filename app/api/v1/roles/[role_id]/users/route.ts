import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, getUserPermissionNames, hasManagementRole } from '@/lib/server-auth';

const ROLE_VIEW_PERMISSION = 'users.view';
const ROLE_MANAGE_PERMISSION = 'users.manage_roles';

export async function GET(request: NextRequest, context: { params: Promise<{ role_id: string }> }) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { role_id } = await context.params;
  const roleId = Number(role_id);
  if (!Number.isFinite(roleId)) {
    return NextResponse.json({ error: 'Invalid role id' }, { status: 400 });
  }

  const permissionNames = await getUserPermissionNames(authUser);
  const isManagementUser = hasManagementRole(authUser.roleNames) || permissionNames.includes(ROLE_MANAGE_PERMISSION);
  const canViewOwnRoleUsers = authUser.roleIds.includes(roleId) && permissionNames.includes(ROLE_VIEW_PERMISSION);

  if (!isManagementUser && !canViewOwnRoleUsers) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select(
        `user_id, users ( user_id, user_name, name, email, profile_image_url, created_at, subscription_status )`
      )
      .eq('role_id', roleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data || []).map((row: any) => ({
      user_id: row.user_id || row.users?.user_id,
      user_name: row.users?.user_name || `${row.users?.name || ''}`,
      email: row.users?.email || null,
      avatar_url: row.users?.profile_image_url || null,
      is_verified: row.users?.is_verified ?? false,
      created_at: row.users?.created_at || null,
      subscription_status: row.users?.subscription_status || null,
    }));

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch role users' }, { status: 500 });
  }
}