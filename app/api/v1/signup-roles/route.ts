import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { PUBLIC_SIGNUP_ROLE_NAMES } from '@/lib/auth-profile';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('role_id, name, description, is_system_role')
      .in('name', PUBLIC_SIGNUP_ROLE_NAMES as unknown as string[]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map results to a lookup and preserve the desired order
    const lookup: Record<string, any> = {};
    (data || []).forEach((r: any) => {
      lookup[r.name] = r;
    });

    const ordered = PUBLIC_SIGNUP_ROLE_NAMES.map((name) => lookup[name] || { name });

    return NextResponse.json({ roles: ordered });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load roles' }, { status: 500 });
  }
}

