import { supabaseServer } from '@/lib/supabase-server';
import { PERMISSIONS } from '@/lib/permissions';

export interface ServerPermission {
  permission_id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface ServerRole {
  role_id: number;
  name: string;
  description: string;
  is_system_role: boolean;
  permissions: ServerPermission[];
}

export interface ServerUserRole {
  role_id: number;
  vet_id: number | null;
  breeder_id: number | null;
  service_provider_id: number | null;
  pet_friendly_place_id: number | null;
  role: ServerRole | null;
}

export interface ServerUserContext {
  user: any;
  roles: ServerRole[];
  permissions: string[];
}

export async function getUserByAuthId(authUserId: string) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return { data, error };
}

export async function getDefaultRoleId(): Promise<number | null> {
  const { data, error } = await supabaseServer
    .from('roles')
    .select('role_id')
    .ilike('name', '%user%')
    .limit(1)
    .single();

  if (error || !data) {
    const fallback = await supabaseServer.from('roles').select('role_id').limit(1).single();
    return fallback.data?.role_id ?? null;
  }

  return data.role_id;
}

export async function assignRolesToUser(userId: number, roleIds: number[]) {
  if (!roleIds || roleIds.length === 0) {
    return { success: false, error: 'No role IDs provided' };
  }

  const rows = roleIds.map((roleId) => ({
    user_id: userId,
    role_id: roleId,
    vet_id: null,
    breeder_id: null,
    service_provider_id: null,
    pet_friendly_place_id: null,
  }));

  const { error } = await supabaseServer.from('user_roles').insert(rows);
  return { success: !error, error };
}

export async function getRolesAndPermissionsForUserId(userId: number) {
  const { data, error } = await supabaseServer
    .from('user_roles')
    .select(`
      role_id,
      vet_id,
      breeder_id,
      service_provider_id,
      pet_friendly_place_id,
      roles (
        role_id,
        name,
        description,
        is_system_role,
        role_permissions (
          permissions (
            permission_id,
            name,
            description,
            resource,
            action
          )
        )
      )
    `)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const permissions = new Set<string>();
  const roles: ServerRole[] = [];

  data?.forEach((userRole: any) => {
    const role = userRole.roles;
    if (!role) return;
    const rolePermissions: ServerPermission[] = [];

    role.role_permissions?.forEach((rp: any) => {
      if (rp.permissions) {
        rolePermissions.push(rp.permissions);
        permissions.add(rp.permissions.name);
      }
    });

    roles.push({
      role_id: role.role_id,
      name: role.name,
      description: role.description,
      is_system_role: role.is_system_role,
      permissions: rolePermissions,
    });
  });

  return { roles, permissions: Array.from(permissions) };
}

export async function getUserContextByAuthId(authUserId: string): Promise<ServerUserContext | null> {
  const { data: user, error: userError } = await getUserByAuthId(authUserId);
  if (userError || !user) return null;

  const { roles, permissions } = await getRolesAndPermissionsForUserId(user.user_id);

  return { user, roles, permissions };
}

export async function getUserFromToken(token: string) {
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error) {
    return { user: null, error };
  }
  return { user: data.user, error: null };
}

export async function getUserPermissionsForAuthId(authUserId: string) {
  const user = await getUserByAuthId(authUserId);
  if (user.error || !user.data) {
    return [];
  }

  const { permissions } = await getRolesAndPermissionsForUserId(user.data.user_id);
  return permissions;
}

export async function userHasPermission(authUserId: string, permission: string) {
  const permissions = await getUserPermissionsForAuthId(authUserId);
  return permissions.includes(permission);
}

export const DASHBOARD_PERMISSIONS = {
  USERS_VIEW: PERMISSIONS.USERS_VIEW,
  BREEDERS_VIEW: PERMISSIONS.BREEDERS_VIEW,
  VETS_VIEW: PERMISSIONS.VETERINARIANS_VIEW,
  SERVICE_PROVIDERS_VIEW: PERMISSIONS.SERVICE_PROVIDERS_VIEW,
  TRANSACTIONS_VIEW: PERMISSIONS.TRANSACTIONS_VIEW,
  REPORTS_VIEW: PERMISSIONS.REPORTS_VIEW,
};
