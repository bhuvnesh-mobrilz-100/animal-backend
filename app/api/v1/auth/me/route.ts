import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { buildAuthProfile } from '@/lib/auth-profile';

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);

  if (!authUser?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const authProfile = await buildAuthProfile({
    id: authUser.id,
    email: authUser.email,
    roleNames: authUser.roleNames,
  });

  return NextResponse.json({ ...authProfile });
}
