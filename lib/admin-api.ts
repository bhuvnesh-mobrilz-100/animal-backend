import { supabaseAdmin } from './server-supabase';

export function normalizeDate(date?: string | null) {
  return date ? new Date(date).toISOString() : null;
}

export async function expirePastEvents(): Promise<void> {
  try {
    await supabaseAdmin
      .from('events')
      .update({ is_active: false })
      .lt('event_date', new Date().toISOString());
  } catch (error) {
    console.error('Failed to expire past events:', error);
  }
}

export async function getSubscriptionSummary() {
  const { data, error } = await (supabaseAdmin
    .from('users')
    .select('subscription_status, count:user_id', { count: 'exact' }) as any)
    // Supabase JS group() is supported at runtime, but the current types infer a filter builder
    // without group(). We cast to any here to keep the query typed correctly.
    .group('subscription_status');

  if (error) {
    console.error('Subscription summary error:', error.message);
    return [];
  }

  return data || [];
}
