import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './server-supabase';
import { hashAccessToken } from './auth-session';

type SupabaseUser = {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata?: {
    roleName?: string;
    role_name?: string;
    roleNames?: string[];
    role_names?: string[];
    full_name?: string;
  } | null;
  app_metadata?: {
    roleName?: string;
    role_name?: string;
    roleNames?: string[];
    role_names?: string[];
  } | null;
};

type AuthenticatedUser = {
  id: string;
  email: string | null;
  internalUserId: string | null;
  roleIds: number[];
  roleNames: string[];
  accessToken?: string;
};

export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.replace('Bearer ', '').trim();
    if (bearerToken) return bearerToken;
  }

  const cookieCandidates = [
    request.cookies.get('sb-access-token')?.value,
    request.cookies.get('sb-auth-token')?.value,
    ...request.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
      .map((cookie) => cookie.value),
  ].filter(Boolean) as string[];

  for (const candidate of cookieCandidates) {
    const trimmedCandidate = candidate.trim();
    if (!trimmedCandidate) continue;

    if (trimmedCandidate.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmedCandidate);
        const sessionToken = parsed?.access_token || parsed?.session?.access_token;
        if (typeof sessionToken === 'string' && sessionToken.trim()) {
          return sessionToken.trim();
        }
      } catch {
        // Ignore non-JSON cookie payloads.
      }
    }

    if (trimmedCandidate.split('.').length === 3) {
      return trimmedCandidate;
    }
  }

  return null;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = await getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    const errorMessage = error?.message || 'No user';
    if (errorMessage !== 'Auth session missing!') {
      console.error('Server auth failed:', errorMessage);
    }
    return null;
  }

  const internalQuery = await supabaseAdmin
    .from('users')
    .select('user_id, current_access_token_hash')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (internalQuery.error) {
    console.error('Unable to resolve internal user record:', internalQuery.error.message);
    return null;
  }

  const internalUserId = internalQuery.data?.user_id ?? null;
  const storedTokenHash = internalQuery.data?.current_access_token_hash ?? null;

  if (!internalUserId || !storedTokenHash) {
    return null;
  }

  if (storedTokenHash !== hashAccessToken(token)) {
    return null;
  }

  const rolesQuery = internalUserId
    ? await supabaseAdmin
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', internalUserId)
    : { data: [], error: null };

  if (rolesQuery.error) {
    console.error('Error loading user roles:', rolesQuery.error.message);
  }

  const roleIds = Array.from(new Set((rolesQuery.data || []).map((item: any) => item.role_id)));
  const fallbackRoleNames = [
    user.user_metadata?.roleName,
    user.user_metadata?.role_name,
    ...(user.user_metadata?.roleNames || []),
    ...(user.user_metadata?.role_names || []),
    user.app_metadata?.roleName,
    user.app_metadata?.role_name,
    ...(user.app_metadata?.roleNames || []),
    ...(user.app_metadata?.role_names || []),
  ].filter(Boolean) as string[];

  const roleNames = Array.from(
    new Set([
      ...(rolesQuery.data || []).map((item: any) => item.roles?.name).filter(Boolean),
      ...fallbackRoleNames,
    ])
  );

  return {
    id: user.id,
    email: user.email ?? null,
    internalUserId,
    roleIds,
    roleNames,
    accessToken: token,
  };
}

export function buildErrorResponse(message: string, status: number = 401) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireRoles(
  request: NextRequest,
  allowedRoleNames: string[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return buildErrorResponse('Authentication required', 401);
  }

  if (!allowedRoleNames.some((role) => user.roleNames.includes(role))) {
    return buildErrorResponse('Permission denied', 403);
  }

  return { user };
}

export async function getUserPermissionNames(user: AuthenticatedUser): Promise<string[]> {
  if (!user.internalUserId) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select(`
      roles (
        role_permissions (
          permissions (
            name
          )
        )
      )
    `)
    .eq('user_id', user.internalUserId);

  if (error) {
    console.error('Error loading user permissions:', error.message);
    return [];
  }

  const permissionNames = new Set<string>();

  (data || []).forEach((row: any) => {
    row.roles?.role_permissions?.forEach((rolePermission: any) => {
      if (rolePermission.permissions?.name) {
        permissionNames.add(rolePermission.permissions.name);
      }
    });
  });

  return Array.from(permissionNames);
}

export function hasManagementRole(roleNames: string[]): boolean {
  return roleNames.some((roleName) => ['Admin', 'Owner', 'Manager'].includes(roleName));
}

export async function recordAuditLog(payload: {
  actor_user_id: string | null;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert([
      {
        actor_user_id: payload.actor_user_id,
        action: payload.action,
        resource: payload.resource,
        details: payload.details || {},
      },
    ]);
  } catch (error) {
    console.error('Audit log insert failed:', error);
  }
}

export type { AuthenticatedUser };
