import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const params = await context.params;

  const adminCheck = await requireRoles(request, ['Owner', 'Admin', 'Manager']);
  const isAdmin = !('status' in adminCheck);

  let query: any = supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT)
    .eq('support_ticket_id', params.id);

  if (!isAdmin) {
    query = query.eq('user_id', user.internalUserId);
  }

  const { data, error } = await query.single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket: data });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(request, ['Owner', 'Admin', 'Manager']);
  if ('status' in auth) return auth;

  const params = await context.params;
  const body = await request.json();

  const updateData: Record<string, any> = {};
  if (body.status) updateData.status = body.status;
  if (body.priority) updateData.priority = body.priority;
  if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
  if (body.subject) updateData.subject = body.subject;
  updateData.updated_at = new Date().toISOString();

  if (body.status) {
    updateData.last_reply_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update(updateData)
    .eq('support_ticket_id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket: data });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const params = await context.params;

  // Verify the ticket exists and check permissions
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .select('support_ticket_id, user_id, status')
    .eq('support_ticket_id', params.id)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  const isAdmin = user.roleNames.some(r => ['owner', 'admin', 'manager'].includes(r.toLowerCase()));
  const isOwner = String(ticket.user_id) === String(user.internalUserId);

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  if (!isAdmin && ticket.status === 'closed') {
    return NextResponse.json({ error: 'Cannot reply to a closed ticket' }, { status: 400 });
  }

  const contentType = request.headers.get('content-type') || '';
  let replyText: string;
  let imageUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    replyText = String(formData.get('reply') || '');
    const file = formData.get('file');
    if (file instanceof File) {
      try {
        const uploadResult = await uploadAnimalImage(file, 'support');
        imageUrl = uploadResult.url;
      } catch (uploadError: any) {
        console.error('Image upload failed:', uploadError);
      }
    }
  } else {
    const body = await request.json();
    replyText = body.reply || '';
  }

  if (!replyText.trim()) {
    return NextResponse.json({ error: 'Reply is required' }, { status: 400 });
  }

  const replyData: Record<string, any> = {
    support_ticket_id: params.id,
    reply: replyText.trim(),
    responder_user_id: user.internalUserId,
  };

  if (imageUrl) {
    replyData.image_url = imageUrl;
  }

  const { data: replyResult, error: replyError } = await supabaseAdmin
    .from('support_replies')
    .insert([replyData])
    .select()
    .single();

  if (replyError) {
    return NextResponse.json({ error: replyError.message }, { status: 500 });
  }

  // Status logic: admin reply → in_progress, user reply → keep current/open
  const newStatus = isAdmin ? 'in_progress' : (ticket.status === 'open' ? 'open' : 'in_progress');

  await supabaseAdmin
    .from('support_tickets')
    .update({
      status: newStatus,
      last_reply_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('support_ticket_id', params.id);

  return NextResponse.json({ reply: replyResult });
}
