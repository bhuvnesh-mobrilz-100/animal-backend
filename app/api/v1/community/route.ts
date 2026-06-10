import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { deleteAnimalImageByUrl, uploadAnimalImage } from '@/lib/storage-upload';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

type CommunityPayload = {
  title?: unknown;
  body?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  file?: unknown;
};

async function readPayload(request: NextRequest): Promise<CommunityPayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      title: formData.get('title'),
      body: formData.get('body'),
      image_url: formData.get('image_url'),
      imageUrl: formData.get('imageUrl'),
      file: formData.get('file'),
    };
  }

  try {
    return (await request.json()) as CommunityPayload;
  } catch {
    return {};
  }
}

function normalizeImageUrl(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

async function resolveImageUrl(payload: CommunityPayload): Promise<string | null | undefined> {
  const rawValue = payload.file ?? payload.image_url ?? payload.imageUrl;

  if (rawValue instanceof File) {
    const uploadResult = await uploadAnimalImage(rawValue, 'community_posts');
    return uploadResult.url;
  }

  return normalizeImageUrl(rawValue);
}

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

  const payload = await readPayload(request);
  const title = typeof payload.title === 'string' ? payload.title.trim() : undefined;
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) {
    return NextResponse.json({ error: 'Post body is required' }, { status: 400 });
  }

  const image_url = await resolveImageUrl(payload);
  const insertPayload: Record<string, unknown> = {
    user_id: user.internalUserId,
    title: title || null,
    body,
  };

  if (image_url !== undefined) {
    insertPayload.image_url = image_url;
  }

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert([insertPayload])
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

  const payload = await readPayload(request);
  const canEdit = await supabaseAdmin
    .from('community_posts')
    .select('user_id, image_url')
    .eq('post_id', postId)
    .single();

  if (canEdit.error || !canEdit.data) {
    return NextResponse.json({ error: canEdit.error?.message || 'Post not found' }, { status: 404 });
  }

  if (canEdit.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const updates: Record<string, unknown> = {};
  if (payload.title !== undefined) {
    updates.title = typeof payload.title === 'string' ? payload.title.trim() || null : null;
  }
  if (payload.body !== undefined) {
    updates.body = typeof payload.body === 'string' ? payload.body.trim() : payload.body;
  }

  const resolvedImageUrl = await resolveImageUrl(payload);
  if (resolvedImageUrl !== undefined) {
    updates.image_url = resolvedImageUrl;
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

  const previousImageUrl = canEdit.data.image_url;
  if (
    typeof previousImageUrl === 'string' &&
    previousImageUrl &&
    previousImageUrl !== resolvedImageUrl
  ) {
    try {
      await deleteAnimalImageByUrl(previousImageUrl);
    } catch (cleanupError) {
      console.warn('Failed to clean up previous community image:', cleanupError);
    }
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
    .select('user_id, image_url')
    .eq('post_id', postId)
    .single();

  if (canDelete.error || !canDelete.data) {
    return NextResponse.json({ error: canDelete.error?.message || 'Post not found' }, { status: 404 });
  }

  if (canDelete.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const postImageUrl = canDelete.data.image_url;
  const { error } = await supabaseAdmin.from('community_posts').delete().eq('post_id', postId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (typeof postImageUrl === 'string' && postImageUrl) {
    try {
      await deleteAnimalImageByUrl(postImageUrl);
    } catch (cleanupError) {
      console.warn('Failed to clean up deleted community post image:', cleanupError);
    }
  }

  return NextResponse.json({ success: true });
}
