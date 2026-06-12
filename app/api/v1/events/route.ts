import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';
import { uploadAnimalImage } from '@/lib/storage-upload';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const approvedOnly = request.nextUrl.searchParams.get('approved_only') === 'true';
  const activeOnly = request.nextUrl.searchParams.get('active_only') === 'true';

  let query = supabaseAdmin
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (approvedOnly) {
    query = query.eq('is_approved', true);
  }
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let title: string | undefined;
  let description: string | undefined;
  let event_date: string | undefined;
  let venue: string | undefined;
  let location: string | undefined;
  let expiry: string | undefined;
  let event_category_id: number | undefined;
  let image_url: string | undefined;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    title = formData.get('title') as string | undefined;
    description = formData.get('description') as string | undefined;
    event_date = formData.get('event_date') as string | undefined;
    venue = formData.get('venue') as string | undefined;
    location = formData.get('location') as string | undefined;
    expiry = formData.get('expiry') as string | undefined;
    const categoryId = formData.get('event_category_id');
    event_category_id = categoryId ? Number(categoryId) : undefined;
    image_url = formData.get('image_url') as string | undefined;

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
    venue = body.venue;
    location = body.location;
    expiry = body.expiry;
    event_category_id = body.event_category_id;
    image_url = body.image_url;
  }

  if (!title || !event_date || !venue) {
    return NextResponse.json({ error: 'Title, event date, and venue are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert([
      {
        title,
        description,
        event_date,
        venue,
        location,
        expiry,
        image_url,
        is_active: true,
        is_approved: false,
        user_id: user.internalUserId,
        event_category_id,
      },
    ])
    .select()
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

  const updates = await request.json();
  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('event_id', eventId)
    .select()
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
