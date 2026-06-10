import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, getUserPermissionNames, hasManagementRole } from '@/lib/server-auth';

const ROLE_MANAGE_PERMISSION = 'users.manage_roles';

async function canManageRoles(authUser: any) {
  const permissionNames = await getUserPermissionNames(authUser);
  return hasManagementRole(authUser.roleNames) || permissionNames.includes(ROLE_MANAGE_PERMISSION);
}

async function canViewRole(authUser: any, roleId: number) {
  const isManagementUser = await canManageRoles(authUser);
  if (isManagementUser) return true;
  return authUser.roleIds.includes(roleId);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ role_id: string }> }
) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { role_id } = await context.params;
  const roleId = Number(role_id);
  if (!Number.isFinite(roleId)) {
    return NextResponse.json({ error: 'Invalid role id' }, { status: 400 });
  }

  const isAllowedToView = await canViewRole(authUser, roleId);
  if (!isAllowedToView) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const [{ data: roleData, error: roleError }, { data: permissionsData, error: permissionsError }, { data: rolePermissionsData, error: rolePermissionsError }] =
    await Promise.all([
      supabaseAdmin.from('roles').select('role_id, name, description, is_system_role').eq('role_id', roleId).maybeSingle(),
      supabaseAdmin.from('permissions').select('permission_id, name, description, resource, action').order('resource').order('name'),
      supabaseAdmin.from('role_permissions').select('permission_id').eq('role_id', roleId),
    ]);

  if (roleError || permissionsError || rolePermissionsError) {
    const errorMessage = roleError?.message || permissionsError?.message || rolePermissionsError?.message || 'Unable to fetch role permissions';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  if (!roleData) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const selectedPermissionIds = (rolePermissionsData || []).map((item: any) => item.permission_id).filter(Boolean);

  return NextResponse.json({
    role: roleData,
    permissions: permissionsData || [],
    selectedPermissionIds,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ role_id: string }> }
) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { role_id } = await context.params;
  const roleId = Number(role_id);
  if (!Number.isFinite(roleId)) {
    return NextResponse.json({ error: 'Invalid role id' }, { status: 400 });
  }

  const isManagementUser = await canManageRoles(authUser);
  if (!isManagementUser) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const body = await request.json();
  const permissionIds: number[] = [];

  if (Array.isArray(body.permissionIds)) {
    for (const id of body.permissionIds as unknown[]) {
      const permissionId = Number(id);
      if (Number.isFinite(permissionId)) {
        permissionIds.push(permissionId);
      }
    }
  }

  try {
    await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId);

    if (permissionIds.length > 0) {
      const inserts = permissionIds.map((permissionId: number) => ({ role_id: roleId, permission_id: permissionId }));
      const { error: insertError } = await supabaseAdmin.from('role_permissions').insert(inserts);
      if (insertError) {
        throw insertError;
      }
    }

    const { data: updatedPermissions, error: updatedPermissionsError } = await supabaseAdmin
      .from('permissions')
      .select('permission_id, name, description, resource, action')
      .in('permission_id', permissionIds);

    if (updatedPermissionsError) {
      throw updatedPermissionsError;
    }

    return NextResponse.json({
      success: true,
      permissions: updatedPermissions || [],
      permission_count: permissionIds.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update role permissions' }, { status: 500 });
  }
}
