import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest, requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) {
    const user = await getUserFromRequest(request);
    if (!user || !user.internalUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.internalUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: data });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { subject, message } = await request.json();
  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert([{ user_id: user.internalUserId, subject, initial_message: message, status: 'open' }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const ticketId = request.nextUrl.searchParams.get('ticket_id');
  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const { status, reply } = await request.json();
  const ticket = await supabaseAdmin.from('support_tickets').select('user_id').eq('support_ticket_id', ticketId).single();
  if (ticket.error || !ticket.data) {
    return NextResponse.json({ error: ticket.error?.message || 'Ticket not found' }, { status: 404 });
  }

  if (ticket.data.user_id !== user.internalUserId) {
    const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
    if ('status' in auth) return auth;
  }

  const updates: any = {};
  if (status) updates.status = status;
  if (reply) updates.last_reply_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update(updates)
    .eq('support_ticket_id', ticketId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (reply) {
    await supabaseAdmin.from('support_replies').insert([{ support_ticket_id: ticketId, reply, responder_user_id: user.internalUserId }]);
  }

  return NextResponse.json({ ticket: data });
}
