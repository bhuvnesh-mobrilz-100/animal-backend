import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';
import { uploadAnimalImage } from '@/lib/storage-upload';

export async function GET(request: NextRequest) {
  const serviceCategoryId = request.nextUrl.searchParams.get('service_category_id');
  const search = request.nextUrl.searchParams.get('search');
  const activeOnly = request.nextUrl.searchParams.get('active_only') !== 'false';
  const includeDeleted = request.nextUrl.searchParams.get('include_deleted') === 'true';

  let query = supabaseAdmin
    .from('service_providers')
    .select('*, service_categories(*), service_provider_images(*)')
    .order('name');

  if (serviceCategoryId) {
    query = query.eq('service_category_id', Number(serviceCategoryId));
  }

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`).or(`description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ providers: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const contentType = request.headers.get('content-type') || '';
  let body: Record<string, unknown> = {};
  let uploadedImageUrls: string[] = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const formEntries = Array.from(formData.entries());

    for (const [key, value] of formEntries) {
      if (value instanceof File && value.size > 0) {
        if (value.size > 50 * 1024 * 1024) {
          return NextResponse.json({ error: `${value.name} exceeds the 50MB limit` }, { status: 400 });
        }
        if (!value.type.startsWith('image/')) {
          return NextResponse.json({ error: `${value.name} is not an image` }, { status: 400 });
        }
        const result = await uploadAnimalImage(value, 'service-providers');
        uploadedImageUrls.push(result.url);
      } else if (typeof value === 'string') {
        body[key] = value;
      }
    }

    if (uploadedImageUrls.length > 0) {
      body.image_url = uploadedImageUrls[0];
      body.images = uploadedImageUrls;
    }

    if (body.service_category_id) body.service_category_id = Number(body.service_category_id);
    if (body.rating) body.rating = Number(body.rating);
    if (body.total_reviews) body.total_reviews = Number(body.total_reviews);
    if (body.is_verified !== undefined) body.is_verified = body.is_verified === 'true' || body.is_verified === true;
    if (body.is_active !== undefined) body.is_active = body.is_active === 'true' || body.is_active === true;
    if (body.featured !== undefined) body.featured = body.featured === 'true' || body.featured === true;
    if (body.operating_hours && typeof body.operating_hours === 'string') {
      try { body.operating_hours = JSON.parse(body.operating_hours as string); } catch { /* ignore */ }
    }
  } else {
    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
    }
    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json({ error: 'Request body is empty. Send a valid JSON object.' }, { status: 400 });
    }
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('POST /api/v1/service-providers - JSON parse failed. Content-Type:', contentType, 'Body preview:', rawBody.substring(0, 200));
      const hint = rawBody.includes('=') && rawBody.includes('&')
        ? ' Body looks like form-data. In Postman, use Body > raw > JSON, not form-data.'
        : '';
      return NextResponse.json({ error: 'Invalid JSON in request body.' + hint }, { status: 400 });
    }
  }

  const { name, description, service_category_id, phone, emergency_number, number_2, email, website, image_url, bio, is_verified, is_active, featured, rating, total_reviews, operating_hours, images } = body;

  if (!name || !service_category_id) {
    return NextResponse.json({ error: 'Provider name and service category are required' }, { status: 400 });
  }

  const { data: provider, error } = await supabaseAdmin
    .from('service_providers')
    .insert([{
      name,
      description: description || null,
      service_category_id,
      phone: phone || null,
      emergency_number: emergency_number || null,
      number_2: number_2 || null,
      email: email || null,
      website: website || null,
      image_url: image_url || null,
      bio: bio || null,
      is_verified: is_verified ?? false,
      is_active: is_active ?? true,
      featured: featured ?? false,
      rating: rating ?? 0,
      total_reviews: total_reviews ?? 0,
      operating_hours: operating_hours || null,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(images) && images.length > 0) {
    const imageRows = images.map((url: string, idx: number) => ({
      service_provider_id: provider.service_provider_id,
      image_url: url,
      order: idx,
    }));

    const { error: imgError } = await supabaseAdmin
      .from('service_provider_images')
      .insert(imageRows);

    if (imgError) {
      console.error('Failed to save images:', imgError.message);
    }
  }

  return NextResponse.json({ provider });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const providerId = request.nextUrl.searchParams.get('service_provider_id');
  if (!providerId) {
    return NextResponse.json({ error: 'service_provider_id is required' }, { status: 400 });
  }

  let updates: Record<string, unknown>;
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 });
  }
  if (!rawBody || !rawBody.trim()) {
    return NextResponse.json({ error: 'Request body is empty. Send a valid JSON object.' }, { status: 400 });
  }
  try {
    updates = JSON.parse(rawBody);
  } catch (e) {
    console.error('PATCH /api/v1/service-providers - JSON parse failed. Content-Type:', request.headers.get('content-type'), 'Body preview:', rawBody.substring(0, 200));
    const hint = rawBody.includes('=') && rawBody.includes('&')
      ? ' Body looks like form-data. In Postman, use Body > raw > JSON, not form-data.'
      : '';
    return NextResponse.json({
      error: 'Invalid JSON in request body.' + hint
    }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from('service_providers')
    .update(updates)
    .eq('service_provider_id', providerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const providerId = request.nextUrl.searchParams.get('service_provider_id');
  if (!providerId) {
    return NextResponse.json({ error: 'service_provider_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('service_providers').update({ is_deleted: true }).eq('service_provider_id', providerId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
