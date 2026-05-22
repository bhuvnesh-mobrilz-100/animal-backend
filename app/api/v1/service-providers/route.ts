import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const serviceCategoryId = request.nextUrl.searchParams.get('service_category_id');
  const search = request.nextUrl.searchParams.get('search');
  const activeOnly = request.nextUrl.searchParams.get('active_only') === 'true';

  let query = supabaseAdmin
    .from('service_providers')
    .select('*, service_categories(*)')
    .order('name');

  if (serviceCategoryId) {
    query = query.eq('service_category_id', Number(serviceCategoryId));
  }

  if (activeOnly) {
    query = query.eq('is_active', true).eq('is_deleted', false);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`).or(`description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ providers: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const { name, description, service_category_id, phone, email, website, is_active = true } = await request.json();
  if (!name || !service_category_id) {
    return NextResponse.json({ error: 'Provider name and service category are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_providers')
    .insert([{ name, description, service_category_id, phone, email, website, is_active }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const providerId = request.nextUrl.searchParams.get('service_provider_id');
  if (!providerId) {
    return NextResponse.json({ error: 'service_provider_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('service_providers')
    .update(updates)
    .eq('service_provider_id', providerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const providerId = request.nextUrl.searchParams.get('service_provider_id');
  if (!providerId) {
    return NextResponse.json({ error: 'service_provider_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('service_providers').update({ is_deleted: true }).eq('service_provider_id', providerId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
