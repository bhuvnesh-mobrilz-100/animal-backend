import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server-supabase";
import { deleteAnimalImageByUrl, uploadAnimalImage } from "@/lib/storage-upload";

type BreedPayload = {
  name?: unknown;
  description?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  animal_type_id?: unknown;
  file?: unknown;
};

async function readPayload(request: NextRequest): Promise<BreedPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return {
      name: formData.get("name"),
      description: formData.get("description"),
      image_url: formData.get("image_url") ?? formData.get("file"),
      imageUrl: formData.get("imageUrl"),
      animal_type_id: formData.get("animal_type_id"),
      file: formData.get("file"),
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

  if (typeof value !== "string") {
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

function normalizeAnimalTypeId(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { data, error } = await supabaseAdmin
    .from("breeds")
    .select("*, animal_type:animal_types(*)")
    .eq("breed_id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const body = await readPayload(request);

  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json(
      { error: "Request body cannot be empty" },
      { status: 400 },
    );
  }

  const updatePayload: Record<string, unknown> = { ...body };
  if (Object.prototype.hasOwnProperty.call(updatePayload, "imageUrl")) {
    if (
      updatePayload.image_url === undefined ||
      updatePayload.image_url === null
    ) {
      updatePayload.image_url = updatePayload.imageUrl;
    }
    delete updatePayload.imageUrl;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, "file")) {
    delete updatePayload.file;
  }

  if (typeof updatePayload.name === "string") {
    updatePayload.name = updatePayload.name.trim();
  }

  if (typeof updatePayload.description === "string") {
    updatePayload.description = updatePayload.description.trim() || null;
  }

  const resolvedImageUrl = await resolveImageUrl(updatePayload);
  if (resolvedImageUrl !== undefined) {
    updatePayload.image_url = resolvedImageUrl;
  }

  const normalizedAnimalTypeId = normalizeAnimalTypeId(
    updatePayload.animal_type_id,
  );
  if (normalizedAnimalTypeId !== undefined) {
    updatePayload.animal_type_id = normalizedAnimalTypeId;
  }

  const { data: currentBreed, error: fetchError } = await supabaseAdmin
    .from("breeds")
    .select("image_url")
    .eq("breed_id", params.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("breeds")
    .update(updatePayload)
    .eq("breed_id", params.id)
    .select("*, animal_type:animal_types(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const previousImageUrl = currentBreed?.image_url;
  if (
    typeof previousImageUrl === "string" &&
    previousImageUrl &&
    previousImageUrl !== resolvedImageUrl
  ) {
    try {
      await deleteAnimalImageByUrl(previousImageUrl);
    } catch (cleanupError) {
      console.warn("Failed to clean up previous breed image:", cleanupError);
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const { data: breed, error: fetchError } = await supabaseAdmin
    .from("breeds")
    .select("image_url")
    .eq("breed_id", params.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const { error } = await supabaseAdmin
    .from("breeds")
    .delete()
    .eq("breed_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const imageUrl = breed?.image_url;
  if (typeof imageUrl === "string" && imageUrl) {
    try {
      await deleteAnimalImageByUrl(imageUrl);
    } catch (cleanupError) {
      console.warn("Failed to clean up deleted breed image:", cleanupError);
    }
  }

  return NextResponse.json({ success: true });
}
