import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
  const since = request.nextUrl.searchParams.get('since');

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(isNaN(limit) ? 50 : Math.min(limit, 200));

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ auditLogs: data || [] });
}
