import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest } from '@/lib/server-auth';
import { uploadAnimalImage } from '@/lib/storage-upload';

const TICKET_SELECT = `
  *,
  users!support_tickets_user_id_fkey (
    user_id, name, surname, email, profile_image_url
  ),
  assigned_user:users!support_tickets_assigned_to_fkey (
    user_id, name, surname, email
  ),
  support_replies (
    *,
    users!support_replies_responder_user_id_fkey (
      name, surname, email
    )
  )
`;

async function readPayload(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      subject: formData.get('subject'),
      message: formData.get('message'),
      priority: formData.get('priority'),
      file: formData.get('file'),
    };
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return {
      subject: formData.get('subject'),
      message: formData.get('message'),
      priority: formData.get('priority'),
      file: null,
    };
  }
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const all = request.nextUrl.searchParams.get('all') === 'true';

  if (all) {
    const normalizedRoles = user.roleNames.map(r => r.toLowerCase());
    if (!['owner', 'admin', 'manager'].some(r => normalizedRoles.includes(r))) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select(TICKET_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tickets: data || [] });
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT)
    .eq('user_id', user.internalUserId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await readPayload(request);

  if (!body.subject || !body.message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
  }

  let imageUrl: string | null = null;
  if (body.file instanceof File) {
    try {
      const uploadResult = await uploadAnimalImage(body.file, 'support');
      imageUrl = uploadResult.url;
    } catch (uploadError: any) {
      console.error('Image upload failed:', uploadError);
    }
  }

  const ticketData: Record<string, any> = {
    user_id: user.internalUserId,
    subject: String(body.subject).trim(),
    initial_message: String(body.message).trim(),
    status: 'in_progress',
    priority: body.priority || 'medium',
  };

  if (imageUrl) {
    ticketData.image_url = imageUrl;
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert([ticketData])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket: data });
}
