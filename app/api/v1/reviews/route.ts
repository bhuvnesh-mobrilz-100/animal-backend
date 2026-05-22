import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('place_id');
  let query = supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false });

  if (placeId) {
    query = query.eq('place_id', Number(placeId));
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { place_id, rating, comment } = await request.json();
  if (!place_id || !rating) {
    return NextResponse.json({ error: 'Place ID and rating are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert([{ user_id: user.internalUserId, place_id, rating, comment, is_approved: false }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Approver']);
  if ('status' in auth) return auth;

  const reviewId = request.nextUrl.searchParams.get('review_id');
  if (!reviewId) {
    return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(updates)
    .eq('review_id', reviewId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const reviewId = request.nextUrl.searchParams.get('review_id');
  if (!reviewId) {
    return NextResponse.json({ error: 'review_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('reviews').delete().eq('review_id', reviewId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
