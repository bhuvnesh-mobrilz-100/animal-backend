import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const categoryId = request.nextUrl.searchParams.get('service_category_id');

  if (categoryId) {
    const { data: category, error } = await supabaseAdmin
      .from('service_categories')
      .select('*')
      .eq('service_category_id', Number(categoryId))
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Service category not found' }, { status: 404 });
    }

    const { data: providers } = await supabaseAdmin
      .from('service_providers')
      .select('*, service_categories(*), service_provider_images(*), services(*)')
      .eq('service_category_id', Number(categoryId))
      .eq('is_deleted', false)
      .order('name');

    return NextResponse.json({ category: { ...category, service_providers: providers || [] } });
  }

  let query = supabaseAdmin.from('service_categories').select('*').order('name');

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
  const { name, description } = body;
  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_categories')
    .insert([{ name, description }])
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

  const categoryId = request.nextUrl.searchParams.get('service_category_id');
  if (!categoryId) {
    return NextResponse.json({ error: 'service_category_id is required' }, { status: 400 });
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
    .from('service_categories')
    .update(updates)
    .eq('service_category_id', categoryId)
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

  const categoryId = request.nextUrl.searchParams.get('service_category_id');
  if (!categoryId) {
    return NextResponse.json({ error: 'service_category_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('service_categories').delete().eq('service_category_id', categoryId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
