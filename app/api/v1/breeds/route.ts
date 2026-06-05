import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { uploadAnimalImage } from '@/lib/storage-upload';

type BreedPayload = {
  name?: unknown;
  description?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  animal_type_id?: unknown;
  file?: unknown;
};

async function readPayload(request: NextRequest): Promise<BreedPayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    return {
      name: formData.get('name'),
      description: formData.get('description'),
      image_url: formData.get('image_url') ?? formData.get('file'),
      imageUrl: formData.get('imageUrl'),
      animal_type_id: formData.get('animal_type_id'),
      file: formData.get('file'),
    };
  }

  try {
    return (await request.json()) as BreedPayload;
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

async function resolveImageUrl(payload: BreedPayload): Promise<string | null | undefined> {
  const rawImageValue = payload.image_url ?? payload.imageUrl ?? payload.file;

  if (rawImageValue instanceof File) {
    const uploadResult = await uploadAnimalImage(rawImageValue, 'breeds');
    return uploadResult.url;
  }

  return normalizeImageUrl(rawImageValue);
}

function normalizeAnimalTypeId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const animalType = request.nextUrl.searchParams.get('animal_type');

  let query = supabaseAdmin
    .from('breeds')
    .select('*, animal_type:animal_types(*)')
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (animalType && animalType !== 'all') {
    query = query.eq('animal_type_id', animalType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await readPayload(request);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const image_url = await resolveImageUrl(body);
  const animal_type_id = normalizeAnimalTypeId(body.animal_type_id);

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!animal_type_id) {
    return NextResponse.json({ error: 'Animal type is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('breeds')
    .insert([{ name, description: description || null, image_url, animal_type_id }])
    .select('*, animal_type:animal_types(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}