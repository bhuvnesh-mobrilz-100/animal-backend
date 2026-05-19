import { NextResponse } from 'next/server';
import { fetchTableCount } from '@/lib/api-utils';
import { getUserFromToken, getUserPermissionsForAuthId, DASHBOARD_PERMISSIONS } from '@/lib/auth-server';
import { PERMISSIONS } from '@/lib/permissions';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Authorization token is required' }, { status: 401 });
  }

  const { user, error } = await getUserFromToken(token);
  if (error || !user) {
    return NextResponse.json({ error: error?.message || 'Invalid token' }, { status: 401 });
  }

  const permissions = await getUserPermissionsForAuthId(user.id);
  const canViewDashboard = permissions.includes(PERMISSIONS.DASHBOARD_VIEW) || [
    DASHBOARD_PERMISSIONS.USERS_VIEW,
    DASHBOARD_PERMISSIONS.BREEDERS_VIEW,
    DASHBOARD_PERMISSIONS.VETS_VIEW,
    DASHBOARD_PERMISSIONS.SERVICE_PROVIDERS_VIEW,
    DASHBOARD_PERMISSIONS.TRANSACTIONS_VIEW,
    DASHBOARD_PERMISSIONS.REPORTS_VIEW,
  ].some((permission) => permissions.includes(permission));

  if (!canViewDashboard) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const summary: Record<string, number> = {};

  if (permissions.includes(DASHBOARD_PERMISSIONS.USERS_VIEW)) {
    summary.users = await fetchTableCount('users');
  }

  if (permissions.includes(DASHBOARD_PERMISSIONS.BREEDERS_VIEW)) {
    summary.breeders = await fetchTableCount('breeders');
  }

  if (permissions.includes(DASHBOARD_PERMISSIONS.VETS_VIEW)) {
    summary.vets = await fetchTableCount('vets');
  }

  if (permissions.includes(DASHBOARD_PERMISSIONS.SERVICE_PROVIDERS_VIEW)) {
    summary.service_providers = await fetchTableCount('service_providers');
  }

  if (permissions.includes(DASHBOARD_PERMISSIONS.TRANSACTIONS_VIEW)) {
    summary.transactions = await fetchTableCount('transactions');
  }

  if (permissions.includes(DASHBOARD_PERMISSIONS.REPORTS_VIEW)) {
    summary.events = await fetchTableCount('events');
    summary.boost_packages = await fetchTableCount('boost_packages');
  }

  return NextResponse.json({ summary, permissions });
}
