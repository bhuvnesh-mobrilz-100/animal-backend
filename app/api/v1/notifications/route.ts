import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('target');
  const status = request.nextUrl.searchParams.get('status');

  let query = supabaseAdmin.from('notifications').select('*').order('send_at', { ascending: false });
  if (target) query = query.eq('target', target);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const { title, body, target = 'all', level = 'info', send_at, status = 'pending' } = await request.json();
  if (!title || !body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert([{ title, body, target, level, send_at, status }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notification: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const notificationId = request.nextUrl.searchParams.get('notification_id');
  if (!notificationId) {
    return NextResponse.json({ error: 'notification_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update(updates)
    .eq('notification_id', notificationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notification: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const notificationId = request.nextUrl.searchParams.get('notification_id');
  if (!notificationId) {
    return NextResponse.json({ error: 'notification_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('notifications').delete().eq('notification_id', notificationId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
