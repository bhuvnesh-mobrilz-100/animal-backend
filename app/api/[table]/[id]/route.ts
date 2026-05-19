import { NextRequest, NextResponse } from 'next/server';
import { getPrimaryKey, validateTable } from '@/lib/api-utils';
import { supabaseServer } from '@/lib/supabase-server';

function resolvePathParams(request: NextRequest, params?: { table?: string; id?: string }) {
  const pathParts = request.nextUrl.pathname.split('/').filter(Boolean);
  return {
    table: params?.table ?? pathParts[pathParts.length - 2],
    id: params?.id ?? pathParts[pathParts.length - 1],
  };
}

export async function GET(request: NextRequest, { params }: { params: { table: string; id: string } }) {
  const { table, id } = resolvePathParams(request, params);
  const invalid = validateTable(table);
  if (invalid) return invalid;

  const primaryKey = getPrimaryKey(table, request.nextUrl.searchParams.get('primaryKey') ?? undefined);
  const { data, error } = await supabaseServer.from(table).select('*').eq(primaryKey, id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: { params: { table: string; id: string } }) {
  const { table, id } = resolvePathParams(request, params);
  const invalid = validateTable(table);
  if (invalid) return invalid;

  const payload = await request.json();
  if (!payload || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 });
  }

  const primaryKey = getPrimaryKey(table, request.nextUrl.searchParams.get('primaryKey') ?? undefined);
  const { data, error } = await supabaseServer.from(table).update(payload).eq(primaryKey, id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: { table: string; id: string } }) {
  const { table, id } = resolvePathParams(request, params);
  const invalid = validateTable(table);
  if (invalid) return invalid;

  const primaryKey = getPrimaryKey(table, request.nextUrl.searchParams.get('primaryKey') ?? undefined);
  const { data, error } = await supabaseServer.from(table).delete().eq(primaryKey, id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
