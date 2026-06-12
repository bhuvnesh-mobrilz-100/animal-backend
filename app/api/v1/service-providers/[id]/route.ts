import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid service provider ID' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('service_providers')
    .select(`
      *,
      location:locations(*),
      service_category:service_categories(*),
      service_provider_images(*),
      services(*),
      service_provider_breeds(
        id,
        breed_id,
        breed:breeds(
          *,
          animal_type:animal_types(*)
        )
      ),
      tags:service_provider_tags(*)
    `)
    .eq('service_provider_id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
  }

  return NextResponse.json({ provider: data });
}
