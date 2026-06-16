import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';
import { uploadAnimalImage } from '@/lib/storage-upload';

async function readPayload(request: NextRequest): Promise<{
  title?: unknown;
  description?: unknown;
  image_url?: unknown;
  file?: unknown;
  is_active?: unknown;
}> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    return {
      title: formData.get('title'),
      description: formData.get('description'),
      image_url: formData.get('image_url'),
      file: formData.get('file'),
      is_active: formData.get('is_active'),
    };
  }

  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function resolveImageUrl(
  image_url?: unknown,
  file?: unknown,
  folder = 'whats-new',
): Promise<string | null> {
  const rawImageValue = image_url ?? file;

  if (rawImageValue instanceof File) {
    const uploadResult = await uploadAnimalImage(rawImageValue, folder);
    return uploadResult.url;
  }

  if (typeof rawImageValue === 'string' && rawImageValue.trim()) {
    return rawImageValue.trim();
  }

  return null;
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');

  let query = supabaseAdmin
    .from('whats_new')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Owner']);
  if (auth instanceof NextResponse) return auth;

  const payload = await readPayload(request);

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const description = typeof payload.description === 'string' ? payload.description.trim() : null;
  const image_url = await resolveImageUrl(payload.image_url, payload.file);
  const is_active = payload.is_active === true || payload.is_active === 'true' || payload.is_active === '1';

  const { data: existing } = await supabaseAdmin
    .from('whats_new')
    .select('whats_new_id')
    .eq('title', title)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `A whats-new entry with the title "${title}" already exists` },
      { status: 409 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('whats_new')
    .insert([{
      title,
      description: description || null,
      image_url,
      is_active,
      created_by: auth.user.internalUserId,
    }])
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
