import { createHash } from 'crypto';
import { supabaseAdmin } from './server-supabase';

export function hashAccessToken(accessToken: string) {
  return createHash('sha256').update(accessToken).digest('hex');
}

export async function setCurrentAccessTokenHash(authUserId: string, accessToken: string | null) {
  const current_access_token_hash = accessToken ? hashAccessToken(accessToken) : null;

  const { error } = await supabaseAdmin
    .from('users')
    .update({ current_access_token_hash })
    .eq('auth_user_id', authUserId);

  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('current_access_token_hash')) {
      return;
    }
    throw error;
  }
}