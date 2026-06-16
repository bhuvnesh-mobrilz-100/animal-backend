import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const includeDeleted = request.nextUrl.searchParams.get('include_deleted');

  let query = supabaseAdmin
    .from('pet_friendly_places')
    .select(`*, location:locations(*)`)
    .order('name');

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ places: data || [] });
}

function parseFormValue(value: any): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  try { return JSON.parse(trimmed); } catch { }
  return trimmed;
}

export async function POST(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  let body: any;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    body = {};
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (typeof value === 'object') return;
      body[key] = parseFormValue(value);
    });
  } else {
    body = await request.json();
  }

  const {
    name,
    description,
    image_url,
    phone,
    email,
    website,
    rating = 0,
    is_verified = false,
    location_id,
    operating_hours,
    amenities,
    pet_policy,
    address,
    latitude,
    longitude,
    show_publicly = true,
  } = body;

  if (!name) {
    return NextResponse.json({ error: 'Place name is required' }, { status: 400 });
  }

  // Coerce types that might come as strings from form-data
  const finalRating = typeof rating === 'string' ? parseInt(rating, 10) || 0 : (rating ?? 0);
  const finalIsVerified = is_verified === true || is_verified === 'true' || is_verified === 1;
  const finalShowPublicly = show_publicly === true || show_publicly === 'true' || show_publicly === 1;

  // Upsert location: find by address, reuse if exists, otherwise create
  let resolvedLocationId = location_id ?? undefined;
  if (address) {
    const { data: existingLocation } = await supabaseAdmin
      .from('locations')
      .select('location_id')
      .eq('address', address)
      .maybeSingle();

    if (existingLocation) {
      await supabaseAdmin
        .from('locations')
        .update({ latitude, longitude, show_publicly: finalShowPublicly })
        .eq('location_id', existingLocation.location_id);
      resolvedLocationId = existingLocation.location_id;
    } else {
      const { data: newLocation, error: locationError } = await supabaseAdmin
        .from('locations')
        .insert([{ address, latitude, longitude, show_publicly: finalShowPublicly }])
        .select('location_id')
        .single();

      if (locationError) {
        return NextResponse.json({ error: locationError.message }, { status: 500 });
      }
      resolvedLocationId = newLocation.location_id;
    }
  }

  // Ensure amenities is an array (not a raw string)
  let finalAmenities = amenities ?? null;
  if (typeof finalAmenities === 'string') {
    finalAmenities = finalAmenities.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (Array.isArray(finalAmenities) && finalAmenities.length === 0) {
    finalAmenities = null;
  }

  const insertData: any = {
    name,
    description: description || null,
    image_url: image_url || null,
    phone: phone || null,
    email: email || null,
    website: website || null,
    rating: finalRating,
    is_verified: finalIsVerified,
    location_id: resolvedLocationId ?? null,
    operating_hours: operating_hours || null,
    amenities: finalAmenities,
    pet_policy: pet_policy || null,
  };

  const { data, error } = await supabaseAdmin
    .from('pet_friendly_places')
    .insert([insertData])
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to create place' }, { status: 500 });
  }

  const { data: createdPlace } = await supabaseAdmin
    .from('pet_friendly_places')
    .select(`*, location:locations(*)`)
    .eq('pet_friendly_place_id', data.pet_friendly_place_id)
    .single();

  return NextResponse.json({ place: createdPlace });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const placeId = request.nextUrl.searchParams.get('place_id');
  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  let body: any;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    body = {};
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (typeof value === 'object') return;
      body[key] = parseFormValue(value);
    });
  } else {
    body = await request.json();
  }

  const {
    name,
    description,
    image_url,
    phone,
    email,
    website,
    rating,
    is_verified,
    operating_hours,
    amenities,
    pet_policy,
    address,
    latitude,
    longitude,
    show_publicly,
  } = body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (image_url !== undefined) updates.image_url = image_url;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (website !== undefined) updates.website = website;
  if (rating !== undefined) updates.rating = typeof rating === 'string' ? parseInt(rating, 10) || 0 : rating;
  if (is_verified !== undefined) updates.is_verified = is_verified === true || is_verified === 'true' || is_verified === 1;
  if (operating_hours !== undefined) updates.operating_hours = operating_hours;
  if (amenities !== undefined) {
    updates.amenities = typeof amenities === 'string'
      ? amenities.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(amenities) && amenities.length === 0 ? null : amenities;
  }
  if (pet_policy !== undefined) updates.pet_policy = pet_policy;

  // Handle location: upsert — reuse existing address or create new
  if (address) {
    const finalShowPublicly = show_publicly === true || show_publicly === 'true' || show_publicly === 1;

    const { data: existingLocation } = await supabaseAdmin
      .from('locations')
      .select('location_id')
      .eq('address', address)
      .maybeSingle();

    if (existingLocation) {
      await supabaseAdmin
        .from('locations')
        .update({ latitude, longitude, show_publicly: finalShowPublicly })
        .eq('location_id', existingLocation.location_id);
      updates.location_id = existingLocation.location_id;
    } else if (body.location_id) {
      await supabaseAdmin
        .from('locations')
        .update({ address, latitude, longitude, show_publicly: finalShowPublicly })
        .eq('location_id', body.location_id);
      updates.location_id = body.location_id;
    } else {
      const { data: newLocation } = await supabaseAdmin
        .from('locations')
        .insert([{ address, latitude, longitude, show_publicly: finalShowPublicly }])
        .select('location_id')
        .single();

      if (newLocation) updates.location_id = newLocation.location_id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('pet_friendly_places')
    .update(updates)
    .eq('pet_friendly_place_id', placeId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: updatedPlace } = await supabaseAdmin
    .from('pet_friendly_places')
    .select(`*, location:locations(*)`)
    .eq('pet_friendly_place_id', placeId)
    .single();

  return NextResponse.json({ place: updatedPlace });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const placeId = request.nextUrl.searchParams.get('place_id');
  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('pet_friendly_places')
    .update({ is_deleted: true })
    .eq('pet_friendly_place_id', placeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
