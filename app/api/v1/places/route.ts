import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get('group_id');
  const animalTypeId = request.nextUrl.searchParams.get('animal_type_id');
  const search = request.nextUrl.searchParams.get('search');

  let query = supabaseAdmin
    .from('pet_friendly_places')
    .select(`
      *,
      place_groups(group_id),
      place_animal_types(animal_type_id)
    `)
    .order('name');

  if (groupId) {
    query = query.eq('place_groups.group_id', Number(groupId));
  }

  if (animalTypeId) {
    query = query.eq('place_animal_types.animal_type_id', Number(animalTypeId));
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ places: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const body = await request.json();
  const { name, description, address, phone, email, website, place_type, price_range, is_verified = false, group_ids = [], animal_type_ids = [] } = body;

  if (!name || !address) {
    return NextResponse.json({ error: 'Place name and address are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('pet_friendly_places')
    .insert([{ name, description, address, phone, email, website, place_type, price_range, is_verified }])
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to create place' }, { status: 500 });
  }

  if (group_ids.length > 0) {
    await supabaseAdmin.from('place_groups').insert(
      group_ids.map((groupId: number) => ({ place_id: data.place_id, group_id: groupId }))
    );
  }

  if (animal_type_ids.length > 0) {
    await supabaseAdmin.from('place_animal_types').insert(
      animal_type_ids.map((animalTypeId: number) => ({ place_id: data.place_id, animal_type_id: animalTypeId }))
    );
  }

  return NextResponse.json({ place: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const placeId = request.nextUrl.searchParams.get('place_id');
  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('pet_friendly_places')
    .update(updates)
    .eq('place_id', placeId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ place: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const placeId = request.nextUrl.searchParams.get('place_id');
  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('pet_friendly_places').delete().eq('place_id', placeId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
