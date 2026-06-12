import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
// show complete detail of the category and ashow all the provider associated with the category
export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('service_category_id');
  if (!categoryId) {
    return NextResponse.json({ error: 'service_category_id is required' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from('service_categories')
    .select('*, service_providers(service_provider_id,name,description,service_category_id,phone,email,website,is_active)')
    .eq('service_category_id', categoryId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}