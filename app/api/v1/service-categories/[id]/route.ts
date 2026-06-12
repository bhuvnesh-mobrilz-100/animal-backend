import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: 'Invalid service category ID' }, { status: 400 });
  }

  const { data: category, error } = await supabaseAdmin
    .from('service_categories')
    .select('*')
    .eq('service_category_id', Number(id))
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
    .eq('service_category_id', Number(id))
    .eq('is_deleted', false)
    .order('name');

  return NextResponse.json({ category: { ...category, service_providers: providers || [] } });
}
