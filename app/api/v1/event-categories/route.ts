import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  let query = supabaseAdmin.from('event_categories').select('*').order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`).or(`description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const { name, description, icon, color } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('event_categories')
    .insert([{ name, description, icon, color }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const categoryId = request.nextUrl.searchParams.get('event_category_id');
  if (!categoryId) {
    return NextResponse.json({ error: 'event_category_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('event_categories')
    .update(updates)
    .eq('event_category_id', categoryId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const categoryId = request.nextUrl.searchParams.get('event_category_id');
  if (!categoryId) {
    return NextResponse.json({ error: 'event_category_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('event_categories').delete().eq('event_category_id', categoryId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
