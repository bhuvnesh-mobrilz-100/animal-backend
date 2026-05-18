import { supabase } from './supabase';

export interface Permission {
  permission_id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  role_id: number;
  name: string;
  description: string;
  is_system_role: boolean;
}

export interface UserPermission {
  role_id: number;
  permission_id: number;
  permissions: Permission;
}

// Permission constants for easy reference
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  BREEDERS_VIEW: 'breeders.view',
  BREEDERS_CREATE: 'breeders.create',
  BREEDERS_UPDATE: 'breeders.update',
  BREEDERS_DELETE: 'breeders.delete',
  BREEDS_VIEW: 'breeds.view',
  BREEDS_CREATE: 'breeds.create',
  BREEDS_UPDATE: 'breeds.update',
  BREEDS_DELETE: 'breeds.delete',
  VETERINARIANS_VIEW: 'veterinarians.view',
  VETERINARIANS_CREATE: 'veterinarians.create',
  VETERINARIANS_UPDATE: 'veterinarians.update',
  VETERINARIANS_DELETE: 'veterinarians.delete',
  SERVICE_PROVIDERS_VIEW: 'service_providers.view',
  SERVICE_PROVIDERS_CREATE: 'service_providers.create',
  SERVICE_PROVIDERS_UPDATE: 'service_providers.update',
  SERVICE_PROVIDERS_DELETE: 'service_providers.delete',
  TRANSACTIONS_VIEW: 'transactions.view',
  TRANSACTIONS_CREATE: 'transactions.create',
  TRANSACTIONS_UPDATE: 'transactions.update',
  TRANSACTIONS_DELETE: 'transactions.delete',
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
} as const;

// Cache for user permissions to avoid repeated database calls
let userPermissionsCache: Map<string, string[]> = new Map();
let cacheExpiry: Map<string, number> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all permissions for a user (including entity-specific permissions)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const now = Date.now();
  const cached = userPermissionsCache.get(userId);
  const expiry = cacheExpiry.get(userId);

  // Return cached result if still valid
  if (cached && expiry && now < expiry) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        vet_id,
        breeder_id,
        pet_friendly_place_id,
        service_provider_id,
        roles (
          role_permissions (
            permissions (
              name
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const permissions = new Set<string>();
    
    data?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.name) {
          permissions.add(rp.permissions.name);
        }
      });
    });

    const permissionArray = Array.from(permissions);
    
    // Cache the result
    userPermissionsCache.set(userId, permissionArray);
    cacheExpiry.set(userId, now + CACHE_DURATION);

    return permissionArray;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Get permissions for a user for a specific entity
 */
export async function getUserEntityPermissions(
  userId: string,
  entityType: 'vet' | 'breeder' | 'service_provider' | 'pet_friendly_place',
  entityId: number
): Promise<string[]> {
  try {
    const entityColumn = `${entityType}_id`;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          role_permissions (
            permissions (
              name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .or(`${entityColumn}.eq.${entityId},${entityColumn}.is.null`);

    if (error) throw error;

    const permissions = new Set<string>();
    
    data?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.name) {
          permissions.add(rp.permissions.name);
        }
      });
    });

    return Array.from(permissions);
  } catch (error) {
    console.error('Error fetching user entity permissions:', error);
    return [];
  }
}

/**
 * Check if user has permission for a specific entity
 */
export async function hasEntityPermission(
  userId: string,
  permission: string,
  entityType: 'vet' | 'breeder' | 'service_provider' | 'pet_friendly_place',
  entityId: number
): Promise<boolean> {
  const permissions = await getUserEntityPermissions(userId, entityType, entityId);
  return permissions.includes(permission);
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Clear permissions cache for a user (useful after role changes)
 */
export function clearUserPermissionsCache(userId: string): void {
  userPermissionsCache.delete(userId);
  cacheExpiry.delete(userId);
}

/**
 * Clear all permissions cache
 */
export function clearAllPermissionsCache(): void {
  userPermissionsCache.clear();
  cacheExpiry.clear();
}

/**
 * Get all available roles
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions (
          permission_id,
          name,
          description,
          resource,
          action
        )
      `)
      .eq('role_id', roleId);

    if (error) throw error;
    return data?.map((rp: any) => rp.permissions) || [];
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

/**
 * Assign roles to a user
 */
export async function assignRolesToUser(userId: string, roleIds: number[]): Promise<boolean> {
  try {
    // Remove existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Add new roles
    if (roleIds.length > 0) {
      const userRoles = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
      }));

      const { error } = await supabase
        .from('user_roles')
        .insert(userRoles);

      if (error) throw error;
    }

    // Clear cache for this user
    clearUserPermissionsCache(userId);
    
    return true;
  } catch (error) {
    console.error('Error assigning roles to user:', error);
    return false;
  }
}

/**
 * Create a new role with permissions
 */
export async function createRole(
  name: string,
  description: string,
  permissionIds: number[]
): Promise<Role | null> {
  try {
    // Create the role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .insert([{
        name,
        description,
        is_system_role: false,
      }])
      .select()
      .single();

    if (roleError) throw roleError;

    // Assign permissions to the role
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleData.role_id,
        permission_id: permissionId,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    return roleData;
  } catch (error) {
    console.error('Error creating role:', error);
    return null;
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[]
): Promise<boolean> {
  try {
    // Remove existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Add new permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (error) throw error;
    }

    // Clear all permissions cache since role permissions changed
    clearAllPermissionsCache();
    
    return true;
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return false;
  }
}
