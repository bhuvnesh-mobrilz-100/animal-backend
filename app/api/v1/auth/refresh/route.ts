import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase refresh-token route requires Supabase environment variables');
}

export async function POST(request: NextRequest) {
  const { refresh_token } = await request.json();

  if (!refresh_token) {
    return NextResponse.json({ error: 'refresh_token is required' }, { status: 400 });
  }

  const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
      headers.set('apikey', supabaseAnonKey!);
      headers.set('Authorization', `Bearer ${supabaseAnonKey!}`);
      return headers;
    })(),
    body: new URLSearchParams({ refresh_token }).toString(),
  });

  const authData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: authData.error_description || authData.error || 'Unable to refresh session' }, { status: tokenResponse.status });
  }

  return NextResponse.json(authData);
}
