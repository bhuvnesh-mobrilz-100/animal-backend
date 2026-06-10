import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const breederId = request.nextUrl.searchParams.get('breeder_id');
  const search = request.nextUrl.searchParams.get('search');

  if (breederId) {
    const { data, error } = await supabaseAdmin
      .from('breeders')
      .select('*, location:locations(*)')
      .eq('breeder_id', breederId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ breeder: data });
  }

  let query = supabaseAdmin
    .from('breeders')
    .select('*, location:locations(*)')
    .eq('is_deleted', false)
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ breeders: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const { name, bio, image_url, phone, rating, is_verified, location_id } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('breeders')
    .insert([{ name, bio, image_url, phone, rating, is_verified, location_id }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ breeder: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const breederId = request.nextUrl.searchParams.get('breeder_id');
  if (!breederId) {
    return NextResponse.json({ error: 'breeder_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('breeders')
    .update(updates)
    .eq('breeder_id', breederId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ breeder: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const breederId = request.nextUrl.searchParams.get('breeder_id');
  if (!breederId) {
    return NextResponse.json({ error: 'breeder_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('breeders')
    .update({ is_deleted: true })
    .eq('breeder_id', breederId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
