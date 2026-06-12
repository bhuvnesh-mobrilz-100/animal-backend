import { supabaseAdmin } from '@/lib/server-supabase';

export const ANIMAL_IMAGE_BUCKET = 'animalclickposts';

export function extractAnimalImagePathFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const bucketIndex = pathParts.findIndex((part) => part === ANIMAL_IMAGE_BUCKET);

    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }

    return null;
  } catch {
    return null;
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function ensureAnimalImageBucketExists() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) {
    throw new Error(`Unable to inspect storage buckets: ${listError.message}`);
  }

  const existingBucket = buckets?.find((bucket) => bucket.name === ANIMAL_IMAGE_BUCKET);
  if (existingBucket) {
    if (!existingBucket.public) {
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(ANIMAL_IMAGE_BUCKET, {
        public: true,
      });
      if (updateError) {
        console.warn('Failed to update bucket to public:', updateError.message);
      }
    }
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(ANIMAL_IMAGE_BUCKET, {
    public: true,
  });

  if (createError) {
    throw new Error(`Unable to create storage bucket ${ANIMAL_IMAGE_BUCKET}: ${createError.message}`);
  }
}

export async function uploadAnimalImage(file: File, folder = 'uploads') {
  await ensureAnimalImageBucketExists();

  const sanitizedFolder = folder.replace(/(^\/+|\/+?$)/g, '');
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const path = `${sanitizedFolder}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage.from(ANIMAL_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(ANIMAL_IMAGE_BUCKET).getPublicUrl(path);
  const publicUrl = publicUrlData?.publicUrl;

  if (!publicUrl) {
    throw new Error('Failed to generate public URL for uploaded image');
  }

  return {
    url: publicUrl,
    path,
  };
}

export async function deleteAnimalImageByUrl(url: string) {
  const filePath = extractAnimalImagePathFromUrl(url);

  if (!filePath) {
    return;
  }

  const { error } = await supabaseAdmin.storage.from(ANIMAL_IMAGE_BUCKET).remove([filePath]);

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(`Failed to delete image file: ${error.message}`);
  }
}