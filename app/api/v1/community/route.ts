import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');

  let query = supabaseAdmin
    .from('community_posts')
    .select('*, post_likes(reaction), community_comments(user_id,comment,created_at,updated_at,users ( name ) )')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`).or(`body.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts = (data || []).map((post: any) => {
    const likes = Array.isArray(post.post_likes)
      ? (post.post_likes as Array<{ reaction?: string }>)
      : [];

    return {
      ...post,
      likes_count: likes.filter((item) => item.reaction === 'like').length,
      dislikes_count: likes.filter((item) => item.reaction === 'dislike').length,
      comments_count: Array.isArray(post.community_comments) ? post.community_comments.length : 0,
    };
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { title, body } = await request.json();
  if (!body) {
    return NextResponse.json({ error: 'Post body is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert([{ user_id: user.internalUserId, title, body }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get('post_id');
  if (!postId) {
    return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
  }

  const updates = await request.json();
  const canEdit = await supabaseAdmin
    .from('community_posts')
    .select('user_id')
    .eq('post_id', postId)
    .single();

  if (canEdit.error || !canEdit.data) {
    return NextResponse.json({ error: canEdit.error?.message || 'Post not found' }, { status: 404 });
  }

  if (canEdit.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .update(updates)
    .eq('post_id', postId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get('post_id');
  if (!postId) {
    return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
  }

  const canDelete = await supabaseAdmin
    .from('community_posts')
    .select('user_id')
    .eq('post_id', postId)
    .single();

  if (canDelete.error || !canDelete.data) {
    return NextResponse.json({ error: canDelete.error?.message || 'Post not found' }, { status: 404 });
  }

  if (canDelete.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const { error } = await supabaseAdmin.from('community_posts').delete().eq('post_id', postId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
