import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { refresh_token } = body;

  if (!refresh_token) {
    return NextResponse.json({ error: 'refresh_token is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer.auth.refreshSession({ refresh_token });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ session: data.session, user: data.user });
}
