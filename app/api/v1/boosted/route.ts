import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const activeOnly = request.nextUrl.searchParams.get('active_only') === 'true';
  const entityType = request.nextUrl.searchParams.get('entity_type');

  let query = supabaseAdmin
    .from('entity_boosts')
    .select('*, boost_packages(*), service_providers(*), veterinarians(*), breeders(*), pet_friendly_places(*)')
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }
  if (search) {
    query = query.ilike('entity_type', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boosts: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const { boost_package_id, entity_type, vet_id, breeder_id, pet_friendly_place_id, service_provider_id, start_date, end_date } = await request.json();
  if (!boost_package_id || !entity_type) {
    return NextResponse.json({ error: 'boost_package_id and entity_type are required' }, { status: 400 });
  }

  const packageResult = await supabaseAdmin
    .from('boost_packages')
    .select('duration_days')
    .eq('boost_package_id', boost_package_id)
    .single();

  if (packageResult.error || !packageResult.data) {
    return NextResponse.json({ error: packageResult.error?.message || 'Boost package not found' }, { status: 404 });
  }

  const finalStartDate = start_date || new Date().toISOString();
  const finalEndDate = end_date || new Date(Date.now() + (Number(packageResult.data.duration_days) || 30) * 24 * 60 * 60 * 1000).toISOString();

  const insertData: any = {
    boost_package_id,
    entity_type,
    start_date: finalStartDate,
    end_date: finalEndDate,
    is_active: true,
  };

  if (vet_id) insertData.vet_id = vet_id;
  if (breeder_id) insertData.breeder_id = breeder_id;
  if (pet_friendly_place_id) insertData.pet_friendly_place_id = pet_friendly_place_id;
  if (service_provider_id) insertData.service_provider_id = service_provider_id;

  const { data, error } = await supabaseAdmin
    .from('entity_boosts')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boost: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const boostId = request.nextUrl.searchParams.get('entity_boost_id');
  if (!boostId) {
    return NextResponse.json({ error: 'entity_boost_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('entity_boosts')
    .update(updates)
    .eq('entity_boost_id', boostId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boost: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const boostId = request.nextUrl.searchParams.get('entity_boost_id');
  if (!boostId) {
    return NextResponse.json({ error: 'entity_boost_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('entity_boosts').delete().eq('entity_boost_id', boostId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
