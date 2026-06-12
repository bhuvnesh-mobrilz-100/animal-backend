import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const mine = request.nextUrl.searchParams.get('mine') === 'true';
  const status = request.nextUrl.searchParams.get('status');

  if (mine) {
    const user = await getUserFromRequest(request);
    if (!user || !user.internalUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('provider_requests')
      .select('*, pet_friendly_places(*)')
      .eq('user_id', user.internalUserId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data });
  }

  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  let query = supabaseAdmin
    .from('provider_requests')
    .select('*, users(user_id, email, name, surname), pet_friendly_places(*)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
  }
  if (!rawBody || !rawBody.trim()) {
    return NextResponse.json({ error: 'Request body is empty. Send a valid JSON object.' }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  const { place_id, notes } = body;
  if (!place_id) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('provider_requests')
    .insert([{ user_id: user.internalUserId, place_id, notes, status: 'pending' }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const requestId = request.nextUrl.searchParams.get('request_id');
  if (!requestId) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
  }
  if (!rawBody || !rawBody.trim()) {
    return NextResponse.json({ error: 'Request body is empty. Send a valid JSON object.' }, { status: 400 });
  }
  let updates: Record<string, unknown>;
  try {
    updates = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from('provider_requests')
    .update(updates)
    .eq('request_id', requestId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const requestId = request.nextUrl.searchParams.get('request_id');
  if (!requestId) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('provider_requests').delete().eq('request_id', requestId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
