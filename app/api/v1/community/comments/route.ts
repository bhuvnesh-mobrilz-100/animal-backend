import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('post_id');
  if (!postId) {
    return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('community_comments')
    .select('comment_id, post_id, user_id, comment, created_at, updated_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { post_id, comment } = await request.json();
  if (!post_id || !comment) {
    return NextResponse.json({ error: 'post_id and comment are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('community_comments')
    .insert([{ post_id, user_id: user.internalUserId, comment }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const commentId = body?.comment_id ?? request.nextUrl.searchParams.get('comment_id');
  const commentText = body?.comment;

  if (!commentId || !commentText) {
    return NextResponse.json({ error: 'comment_id and comment are required' }, { status: 400 });
  }

  const existing = await supabaseAdmin
    .from('community_comments')
    .select('user_id')
    .eq('comment_id', commentId)
    .single();

  if (existing.error || !existing.data) {
    return NextResponse.json({ error: existing.error?.message || 'Comment not found' }, { status: 404 });
  }

  if (existing.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const { data, error } = await supabaseAdmin
    .from('community_comments')
    .update({ comment: commentText, updated_at: new Date().toISOString() })
    .eq('comment_id', commentId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const commentId = request.nextUrl.searchParams.get('comment_id');
  if (!commentId) {
    return NextResponse.json({ error: 'comment_id is required' }, { status: 400 });
  }

  const existing = await supabaseAdmin
    .from('community_comments')
    .select('user_id')
    .eq('comment_id', commentId)
    .single();

  if (existing.error || !existing.data) {
    return NextResponse.json({ error: existing.error?.message || 'Comment not found' }, { status: 404 });
  }

  if (existing.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const { error } = await supabaseAdmin
    .from('community_comments')
    .delete()
    .eq('comment_id', commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
