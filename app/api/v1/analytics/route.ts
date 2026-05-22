import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { requireRoles } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRoles(request, ['Admin', 'Owner', 'Manager']);
  if ('status' in auth) return auth;

  const userCountResult = await supabaseAdmin.from('users').select('user_id', { count: 'exact', head: true });
  const subscriptionResult = await supabaseAdmin.from('users').select('subscription_status');
  const eventsCountResult = await supabaseAdmin.from('events').select('event_id', { count: 'exact', head: true });
  const postsCountResult = await supabaseAdmin.from('community_posts').select('post_id', { count: 'exact', head: true });
  const reviewsCountResult = await supabaseAdmin.from('reviews').select('review_id', { count: 'exact', head: true });
  const ticketsCountResult = await supabaseAdmin.from('support_tickets').select('support_ticket_id', { count: 'exact', head: true });

  const errors = [
    userCountResult.error,
    subscriptionResult.error,
    eventsCountResult.error,
    postsCountResult.error,
    reviewsCountResult.error,
    ticketsCountResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.map((err) => err?.message).join('; ') }, { status: 500 });
  }

  const subscriptionByStatus = (subscriptionResult.data || []).reduce((acc: Record<string, number>, row: any) => {
    const status = row.subscription_status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    users: userCountResult.count ?? 0,
    subscriptions: subscriptionByStatus,
    events: eventsCountResult.count ?? 0,
    posts: postsCountResult.count ?? 0,
    reviews: reviewsCountResult.count ?? 0,
    supportTickets: ticketsCountResult.count ?? 0,
  });
}
