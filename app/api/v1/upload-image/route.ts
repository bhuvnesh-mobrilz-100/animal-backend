import { NextRequest, NextResponse } from 'next/server';
import { uploadAnimalImage } from '@/lib/storage-upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderValue = formData.get('folder');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const folder = typeof folderValue === 'string' && folderValue.trim() ? folderValue.trim() : 'uploads';
    const { url, path } = await uploadAnimalImage(file, folder);

    return NextResponse.json({
      url,
      path,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
