import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const visibleOnly = request.nextUrl.searchParams.get('visible_only') === 'true';

  let query = supabaseAdmin
    .from('donation_campaigns')
    .select('*, rescue_centres(*)')
    .order('created_at', { ascending: false });

  if (visibleOnly) {
    query = query.eq('visible', true);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`).or(`description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const { rescue_centre_id, title, description, monthly_target, visible = true, expires_at } = await request.json();
  if (!rescue_centre_id || !title || !monthly_target) {
    return NextResponse.json({ error: 'Rescue centre, title, and monthly target are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('donation_campaigns')
    .insert([{ rescue_centre_id, title, description, monthly_target, visible, expires_at }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const campaignId = request.nextUrl.searchParams.get('campaign_id');
  if (!campaignId) {
    return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('donation_campaigns')
    .update(updates)
    .eq('campaign_id', campaignId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const campaignId = request.nextUrl.searchParams.get('campaign_id');
  if (!campaignId) {
    return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('donation_campaigns').delete().eq('campaign_id', campaignId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
