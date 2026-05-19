import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('roles')
    .select(`
      role_id,
      name,
      description,
      is_system_role,
      role_permissions (
        permissions (
          permission_id,
          name,
          description,
          resource,
          action
        )
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const roles = data?.map((role: any) => ({
    role_id: role.role_id,
    name: role.name,
    description: role.description,
    is_system_role: role.is_system_role,
    permissions: role.role_permissions?.map((rp: any) => rp.permissions) ?? [],
  })) || [];

  return NextResponse.json({ roles });
}
