import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';
import { uploadAnimalImage } from '@/lib/storage-upload';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const approvedOnly = request.nextUrl.searchParams.get('approved_only') === 'true';
  const activeOnly = request.nextUrl.searchParams.get('active_only') === 'true';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const selectStr = `
    *,
    location:locations(*),
    service_provider:service_providers(
      name,
      service_provider_id
    ),
    event_category:event_categories(
      name,
      event_category_id,
      icon,
      color
    )
  `;

  let upcomingQuery = supabaseAdmin
    .from('events')
    .select(selectStr)
    .gte('event_date', todayStart)
    .order('created_at', { ascending: false });

  let pastQuery = supabaseAdmin
    .from('events')
    .select(selectStr)
    .lt('event_date', todayStart)
    .order('created_at', { ascending: false });

  if (search) {
    upcomingQuery = upcomingQuery.ilike('title', `%${search}%`);
    pastQuery = pastQuery.ilike('title', `%${search}%`);
  }
  if (approvedOnly) {
    upcomingQuery = upcomingQuery.eq('is_approved', true);
    pastQuery = pastQuery.eq('is_approved', true);
  }
  if (activeOnly) {
    upcomingQuery = upcomingQuery.eq('is_active', true);
    pastQuery = pastQuery.eq('is_active', true);
  }

  const [upcomingRes, pastRes] = await Promise.all([
    upcomingQuery,
    pastQuery,
  ]);

  if (upcomingRes.error) {
    return NextResponse.json({ error: upcomingRes.error.message }, { status: 500 });
  }
  if (pastRes.error) {
    return NextResponse.json({ error: pastRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    upcoming: upcomingRes.data,
    past: pastRes.data,
  });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let title: string | undefined;
  let description: string | undefined;
  let event_date: string | undefined;
  let end_date: string | undefined;
  let venue: string | undefined;
  let address: string | undefined;
  let latitude: string | undefined;
  let longitude: string | undefined;
  let show_publicly: boolean = true;
  let expiry: string | undefined;
  let event_category_id: number | undefined;
  let service_provider_id: number | undefined;
  let image_url: string | undefined;
  let price: number | undefined;
  let max_attendees: number | undefined;
  let current_attendees: number = 0;
  let additional_info: any = null;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    title = formData.get('title') as string | undefined;
    description = formData.get('description') as string | undefined;
    event_date = formData.get('event_date') as string | undefined;
    end_date = formData.get('end_date') as string | undefined;
    venue = formData.get('venue') as string | undefined;
    address = formData.get('address') as string | undefined;
    latitude = formData.get('latitude') as string | undefined;
    longitude = formData.get('longitude') as string | undefined;
    show_publicly = formData.get('show_publicly') === 'true';
    expiry = formData.get('expiry') as string | undefined;
    const categoryId = formData.get('event_category_id');
    event_category_id = categoryId ? Number(categoryId) : undefined;
    const providerId = formData.get('service_provider_id');
    service_provider_id = providerId ? Number(providerId) : undefined;
    image_url = formData.get('image_url') as string | undefined;
    const priceVal = formData.get('price');
    price = priceVal ? Number(priceVal) : undefined;
    const maxAtt = formData.get('max_attendees');
    max_attendees = maxAtt ? Number(maxAtt) : undefined;
    const curAtt = formData.get('current_attendees');
    current_attendees = curAtt ? Number(curAtt) : 0;
    const addInfo = formData.get('additional_info');
    if (addInfo) {
      try { additional_info = JSON.parse(addInfo as string); } catch { additional_info = addInfo; }
    }

    const file = formData.get('file');
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
      }
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
      }
      const result = await uploadAnimalImage(file, 'events');
      image_url = result.url;
    }
  } else {
    const body = await request.json();
    title = body.title;
    description = body.description;
    event_date = body.event_date;
    end_date = body.end_date;
    venue = body.venue;
    address = body.address;
    latitude = body.latitude;
    longitude = body.longitude;
    show_publicly = body.show_publicly ?? true;
    expiry = body.expiry;
    event_category_id = body.event_category_id;
    service_provider_id = body.service_provider_id;
    image_url = body.image_url;
    price = body.price;
    max_attendees = body.max_attendees;
    current_attendees = body.current_attendees ?? 0;
    additional_info = body.additional_info || null;
  }

  if (!title || !event_date || !venue) {
    return NextResponse.json({ error: 'Title, event date, and venue are required' }, { status: 400 });
  }

  if (title) {
    const { data: existingEvent } = await supabaseAdmin
      .from('events')
      .select('event_id')
      .eq('title', title)
      .maybeSingle();
    if (existingEvent) {
      return NextResponse.json({ error: 'An event with this title already exists' }, { status: 409 });
    }
  }

  // Find or create location by address
  let location_id: number | null = null;
  const locationAddress = address || venue;
  if (locationAddress) {
    const { data: existing } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('address', locationAddress)
      .maybeSingle();

    if (existing) {
      location_id = existing.location_id;
      if (latitude || longitude || show_publicly !== undefined) {
        await supabaseAdmin
          .from('locations')
          .update({
            latitude: latitude ?? existing.latitude,
            longitude: longitude ?? existing.longitude,
            show_publicly: show_publicly ?? existing.show_publicly,
          })
          .eq('location_id', existing.location_id);
      }
    } else if (latitude || longitude) {
      const { data: locData, error: locError } = await supabaseAdmin
        .from('locations')
        .insert([{
          address: locationAddress,
          latitude: latitude || null,
          longitude: longitude || null,
          show_publicly,
        }])
        .select()
        .single();

      if (!locError && locData) {
        location_id = locData.location_id;
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert([
      {
        title,
        description,
        event_date,
        end_date,
        venue,
        expiry,
        image_url,
        is_active: true,
        is_approved: false,
        user_id: user.internalUserId,
        event_category_id,
        service_provider_id,
        location_id,
        price,
        max_attendees,
        current_attendees,
        additional_info,
      },
    ])
    .select(`
      *,
      location:locations(*),
      service_provider:service_providers(
        name,
        service_provider_id
      ),
      event_category:event_categories(
        name,
        event_category_id,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Approver', 'Manager']);
  if ('status' in auth) return auth;

  const eventId = request.nextUrl.searchParams.get('event_id');
  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  const body = await request.json();
  const { address, latitude, longitude, show_publicly, ...eventUpdates } = body;

  if (eventUpdates.title) {
    const { data: existingEvent } = await supabaseAdmin
      .from('events')
      .select('event_id')
      .eq('title', eventUpdates.title)
      .neq('event_id', eventId)
      .maybeSingle();
    if (existingEvent) {
      return NextResponse.json({ error: 'An event with this title already exists' }, { status: 409 });
    }
  }

  // Find or update location by address
  if (address || latitude || longitude) {
    const locationAddress = address || eventUpdates.venue || 'TBD';
    const { data: existingLoc } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('address', locationAddress)
      .maybeSingle();

    if (existingLoc) {
      await supabaseAdmin
        .from('locations')
        .update({
          latitude: latitude ?? existingLoc.latitude,
          longitude: longitude ?? existingLoc.longitude,
          show_publicly: show_publicly ?? existingLoc.show_publicly,
        })
        .eq('location_id', existingLoc.location_id);
      eventUpdates.location_id = existingLoc.location_id;
    } else if (address && (latitude || longitude)) {
      const { data: locData } = await supabaseAdmin
        .from('locations')
        .insert([{
          address,
          latitude: latitude || null,
          longitude: longitude || null,
          show_publicly: show_publicly ?? true,
        }])
        .select()
        .single();

      if (locData) {
        eventUpdates.location_id = locData.location_id;
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(eventUpdates)
    .eq('event_id', eventId)
    .select(`
      *,
      location:locations(*),
      service_provider:service_providers(
        name,
        service_provider_id
      ),
      event_category:event_categories(
        name,
        event_category_id,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner']);
  if ('status' in auth) return auth;

  const eventId = request.nextUrl.searchParams.get('event_id');
  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('events').delete().eq('event_id', eventId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
