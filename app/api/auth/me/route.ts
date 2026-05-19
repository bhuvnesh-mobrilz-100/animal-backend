import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, getUserContextByAuthId } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Authorization token is required' }, { status: 401 });
  }

  const { user, error } = await getUserFromToken(token);

  if (error || !user) {
    return NextResponse.json({ error: error?.message || 'Invalid token' }, { status: 401 });
  }

  const userContext = await getUserContextByAuthId(user.id);
  if (!userContext) {
    return NextResponse.json({ error: 'User context not found' }, { status: 404 });
  }

  return NextResponse.json({
    auth_user: user,
    profile: userContext.user,
    roles: userContext.roles,
    permissions: userContext.permissions,
  });
}
