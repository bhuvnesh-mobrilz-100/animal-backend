import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const activeOnly = request.nextUrl.searchParams.get('active_only') === 'true';

  let query = supabaseAdmin.from('boost_packages').select('*').order('price', { ascending: true });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`).or(`description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packages: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const { name, description, duration_days, price, is_active = true } = await request.json();
  if (!name || !duration_days || !price) {
    return NextResponse.json({ error: 'Name, duration, and price are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('boost_packages')
    .insert([{ name, description, duration_days, price, is_active }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const packageId = request.nextUrl.searchParams.get('boost_package_id');
  if (!packageId) {
    return NextResponse.json({ error: 'boost_package_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('boost_packages')
    .update(updates)
    .eq('boost_package_id', packageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const packageId = request.nextUrl.searchParams.get('boost_package_id');
  if (!packageId) {
    return NextResponse.json({ error: 'boost_package_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('boost_packages').update({ is_active: false }).eq('boost_package_id', packageId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
