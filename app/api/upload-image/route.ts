import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'animalclickposts';

function normalizeFolder(folder: string | null) {
  const cleaned = folder?.trim().replace(/^\/+|\/+$/g, '');
  return cleaned || '';
}

function getExtension(fileName: string) {
  return fileName.split('.').pop() || 'png';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = normalizeFolder((formData.get('folder') as string | null) ?? null);
    const oldImageUrl = (formData.get('oldImageUrl') as string | null)?.trim() || '';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const fileName = `${uuidv4()}.${getExtension(file.name)}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    if (oldImageUrl) {
      try {
        const oldUrl = new URL(oldImageUrl);
        const pathParts = oldUrl.pathname.split('/');
        const bucketIndex = pathParts.findIndex((part) => part === BUCKET_NAME);
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const oldFilePath = pathParts.slice(bucketIndex + 1).join('/');
          await supabaseServer.storage.from(BUCKET_NAME).remove([oldFilePath]);
        }
      } catch {
        // Ignore invalid old URLs.
      }
    }

    const { data } = supabaseServer.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl, path: filePath });
  } catch (error) {
    console.error('Upload image route failed:', error);
    return NextResponse.json({ error: 'Unable to upload image' }, { status: 500 });
  }
}