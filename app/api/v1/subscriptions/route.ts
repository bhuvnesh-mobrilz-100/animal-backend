import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('subscription_status, subscription_plan, subscription_expires_at')
    .eq('user_id', user.internalUserId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const userId = request.nextUrl.searchParams.get('user_id');
  const updates = await request.json();

  if (!userId) {
    if (!user || !user.internalUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  }

  if (userId && user && !['Admin', 'Owner'].some((role) => user.roleNames.includes(role))) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const targetUserId = userId || user!.internalUserId;
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('user_id', targetUserId)
    .select('subscription_status, subscription_plan, subscription_expires_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}
