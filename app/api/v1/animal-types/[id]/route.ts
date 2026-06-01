import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { deleteAnimalImageByUrl, uploadAnimalImage } from '@/lib/storage-upload';

type AnimalTypePayload = {
  name?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  file?: unknown;
};

async function readPayload(request: NextRequest): Promise<AnimalTypePayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    return {
      name: formData.get('name'),
      image_url: formData.get('image_url') ?? formData.get('file'),
      imageUrl: formData.get('imageUrl'),
      file: formData.get('file'),
    };
  }

  try {
    return (await request.json()) as AnimalTypePayload;
  } catch {
    return {};
  }
}

async function resolveImageUrl(payload: AnimalTypePayload): Promise<string | null | undefined> {
  const rawImageValue = payload.image_url ?? payload.imageUrl ?? payload.file;

  if (rawImageValue instanceof File) {
    const uploadResult = await uploadAnimalImage(rawImageValue, 'animal-types');
    return uploadResult.url;
  }

  if (typeof rawImageValue === 'string') {
    const trimmedValue = rawImageValue.trim();
    return trimmedValue || null;
  }

  return undefined;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { data, error } = await supabaseAdmin
    .from('animal_types')
    .select('*')
    .eq('animal_type_id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const body = await readPayload(request);

  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = { ...body };
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'imageUrl')) {
    updatePayload.image_url = updatePayload.imageUrl;
    delete updatePayload.imageUrl;
  }
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'file')) {
    delete updatePayload.file;
  }
  if (typeof updatePayload.name === 'string') {
    updatePayload.name = updatePayload.name.trim();
  }
  const resolvedImageUrl = await resolveImageUrl(updatePayload);
  if (resolvedImageUrl !== undefined) {
    updatePayload.image_url = resolvedImageUrl;
  }

  const { data: currentAnimalType, error: fetchError } = await supabaseAdmin
    .from('animal_types')
    .select('image_url')
    .eq('animal_type_id', params.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('animal_types')
    .update(updatePayload)
    .eq('animal_type_id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const previousImageUrl = currentAnimalType?.image_url;
  if (typeof previousImageUrl === 'string' && previousImageUrl && previousImageUrl !== resolvedImageUrl) {
    try {
      await deleteAnimalImageByUrl(previousImageUrl);
    } catch (cleanupError) {
      console.warn('Failed to clean up previous animal type image:', cleanupError);
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { data: animalType, error: fetchError } = await supabaseAdmin
    .from('animal_types')
    .select('image_url')
    .eq('animal_type_id', params.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('animal_types').delete().eq('animal_type_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const imageUrl = animalType?.image_url;
  if (typeof imageUrl === 'string' && imageUrl) {
    try {
      await deleteAnimalImageByUrl(imageUrl);
    } catch (cleanupError) {
      console.warn('Failed to clean up deleted animal type image:', cleanupError);
    }
  }

  return NextResponse.json({ success: true });
}