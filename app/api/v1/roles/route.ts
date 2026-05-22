import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, getUserPermissionNames, hasManagementRole } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const permissionNames = await getUserPermissionNames(authUser);
  const canManageAllRoles = hasManagementRole(authUser.roleNames) || permissionNames.includes('users.manage_roles');

  const [{ data: roles, error: rolesError }, { data: userRoles, error: userRolesError }, { data: rolePermissions, error: rolePermissionsError }] = await Promise.all([
    supabaseAdmin.from('roles').select('role_id, name, description, is_system_role, created_at, updated_at'),
    supabaseAdmin.from('user_roles').select('role_id'),
    supabaseAdmin.from('role_permissions').select('role_id, permissions(permission_id, name, description, resource, action)'),
  ]);

  if (rolesError || userRolesError || rolePermissionsError) {
    const errorMessage = rolesError?.message || userRolesError?.message || rolePermissionsError?.message || 'Unable to fetch role data';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const roleUserCounts = userRoles?.reduce<Record<string, number>>((acc, item) => {
    if (!item?.role_id) return acc;
    acc[item.role_id.toString()] = (acc[item.role_id.toString()] || 0) + 1;
    return acc;
  }, {}) ?? {};

  const rolePermissionCounts = rolePermissions?.reduce<Record<string, number>>((acc, item) => {
    if (!item?.role_id) return acc;
    acc[item.role_id.toString()] = (acc[item.role_id.toString()] || 0) + 1;
    return acc;
  }, {}) ?? {};

  const permissionsByRole = (rolePermissions || []).reduce<Record<string, any[]>>((acc, row: any) => {
    const normalizedPermissions = Array.isArray(row.permissions)
      ? row.permissions
      : row.permissions
        ? [row.permissions]
        : [];

    const key = row.role_id?.toString();
    if (!key) return acc;

    acc[key] = [
      ...(acc[key] || []),
      ...normalizedPermissions.filter(Boolean),
    ];

    return acc;
  }, {});

  const visibleRoleIds = new Set(authUser.roleIds.map((roleId) => roleId.toString()));

  const enrichedRoles = (roles?.map((role: any) => ({
    ...role,
    user_count: roleUserCounts[role.role_id.toString()] ?? 0,
    permission_count: rolePermissionCounts[role.role_id.toString()] ?? 0,
    permissions: permissionsByRole[role.role_id.toString()] || [],
    can_edit: canManageAllRoles && !role.is_system_role,
  })) ?? []).filter((role: any) => canManageAllRoles || visibleRoleIds.has(role.role_id.toString()));

  return NextResponse.json({ roles: enrichedRoles });
}
