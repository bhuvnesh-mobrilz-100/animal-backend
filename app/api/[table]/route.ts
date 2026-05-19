import { NextRequest, NextResponse } from 'next/server';
import { buildTableQuery, validateTable } from '@/lib/api-utils';

function resolveTable(request: NextRequest, params?: { table?: string }) {
  return params?.table ?? request.nextUrl.pathname.split('/').filter(Boolean).pop();
}

export async function GET(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const params = await context.params;
  const table = resolveTable(request, params);
  const invalid = validateTable(table);
  if (invalid) return invalid;
  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
  }

  const query = await buildTableQuery(table, request.nextUrl.searchParams);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const params = await context.params;
  const table = resolveTable(request, params);
  const invalid = validateTable(table);
  if (invalid) return invalid;
  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
  }

  const payload = await request.json();
  if (!payload || (Array.isArray(payload) ? payload.length === 0 : Object.keys(payload).length === 0)) {
    return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 });
  }

  const { supabaseServer } = await import('@/lib/supabase-server');
  const { data, error } = await supabaseServer.from(table).insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
