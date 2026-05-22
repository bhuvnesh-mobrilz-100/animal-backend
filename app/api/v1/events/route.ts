import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const approvedOnly = request.nextUrl.searchParams.get('approved_only') === 'true';
  const activeOnly = request.nextUrl.searchParams.get('active_only') === 'true';

  let query = supabaseAdmin
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (approvedOnly) {
    query = query.eq('is_approved', true);
  }
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, event_date, venue, location, expiry, event_category_id } = body;
  if (!title || !event_date || !venue) {
    return NextResponse.json({ error: 'Title, event date, and venue are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert([
      {
        title,
        description,
        event_date,
        venue,
        location,
        expiry,
        is_active: true,
        is_approved: false,
        user_id: user.internalUserId,
        event_category_id,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Approver', 'Manager']);
  if ('status' in auth) return auth;

  const eventId = request.nextUrl.searchParams.get('event_id');
  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('event_id', eventId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const eventId = request.nextUrl.searchParams.get('event_id');
  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('events').delete().eq('event_id', eventId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
