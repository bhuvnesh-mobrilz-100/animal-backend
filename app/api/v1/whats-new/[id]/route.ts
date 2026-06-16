import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server-supabase";
import { requireRoles } from "@/lib/server-auth";
import { uploadAnimalImage } from "@/lib/storage-upload";

async function readPayload(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: Record<string, unknown> = {};
    Array.from(formData.keys()).forEach((key) => {
      payload[key] = formData.get(key);
    });
    return payload;
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
  folder = "whats-new",
): Promise<string | null> {
  const rawImageValue = image_url ?? file;

  if (rawImageValue instanceof File) {
    const uploadResult = await uploadAnimalImage(rawImageValue, folder);
    return uploadResult.url;
  }

  if (typeof rawImageValue === "string" && rawImageValue.trim()) {
    return rawImageValue.trim();
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const { data, error } = await supabaseAdmin
    .from("whats_new")
    .select("*")
    .eq("whats_new_id", params.id)
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
  const auth = await requireRoles(request, ["Owner"]);
  if (auth instanceof NextResponse) return auth;

  const params = await context.params;
  const body = await readPayload(request);

  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json(
      { error: "Request body cannot be empty" },
      { status: 400 },
    );
  }

  const updatePayload: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const newTitle = String(body.title).trim();
    updatePayload.title = newTitle;

    const { data: existing } = await supabaseAdmin
      .from("whats_new")
      .select("whats_new_id")
      .eq("title", newTitle)
      .neq("whats_new_id", params.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `A whats-new entry with the title "${newTitle}" already exists` },
        { status: 409 },
      );
    }
  }

  if (body.description !== undefined) updatePayload.description = String(body.description).trim() || null;

  if (body.image_url !== undefined || body.file !== undefined) {
    const resolvedUrl = await resolveImageUrl(body.image_url, body.file);
    updatePayload.image_url = resolvedUrl;
  }

  if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active);

  const { data, error } = await supabaseAdmin
    .from("whats_new")
    .update(updatePayload)
    .eq("whats_new_id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(request, ['Owner']);
  if (auth instanceof NextResponse) return auth;

  const params = await context.params;

  const { error } = await supabaseAdmin
    .from("whats_new")
    .delete()
    .eq("whats_new_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
