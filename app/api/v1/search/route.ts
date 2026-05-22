import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';

export async function GET(request: NextRequest) {
  const queryTerm = request.nextUrl.searchParams.get('q');
  if (!queryTerm) {
    return NextResponse.json({ places: [], events: [], providers: [], rescueCentres: [] });
  }

  const [placesResult, eventsResult, providersResult, rescueResult] = await Promise.all([
    supabaseAdmin
      .from('pet_friendly_places')
      .select('*')
      .ilike('name', `%${queryTerm}%`)
      .or(`description.ilike.%${queryTerm}%,address.ilike.%${queryTerm}%`)
      .limit(20),
    supabaseAdmin
      .from('events')
      .select('*')
      .ilike('title', `%${queryTerm}%`)
      .or(`description.ilike.%${queryTerm}%,venue.ilike.%${queryTerm}%`)
      .limit(20),
    supabaseAdmin
      .from('service_providers')
      .select('*')
      .ilike('name', `%${queryTerm}%`)
      .or(`description.ilike.%${queryTerm}%,website.ilike.%${queryTerm}%`)
      .limit(20),
    supabaseAdmin
      .from('rescue_centres')
      .select('*')
      .ilike('name', `%${queryTerm}%`)
      .or(`description.ilike.%${queryTerm}%,address.ilike.%${queryTerm}%`)
      .limit(20),
  ]);

  if (placesResult.error || eventsResult.error || providersResult.error || rescueResult.error) {
    const message = placesResult.error?.message || eventsResult.error?.message || providersResult.error?.message || rescueResult.error?.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    places: placesResult.data || [],
    events: eventsResult.data || [],
    providers: providersResult.data || [],
    rescueCentres: rescueResult.data || [],
  });
}
