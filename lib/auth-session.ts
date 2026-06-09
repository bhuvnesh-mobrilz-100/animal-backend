import { createHash } from 'crypto';
import { supabaseAdmin } from './server-supabase';

export function hashAccessToken(accessToken: string) {
  return createHash('sha256').update(accessToken).digest('hex');
}

export function hashRefreshToken(refreshToken: string) {
  return createHash('sha256').update(refreshToken).digest('hex');
}

export async function setCurrentTokenHashes(
  authUserId: string,
  accessToken: string | null,
  refreshToken: string | null
) {
  const current_access_token_hash = accessToken ? hashAccessToken(accessToken) : null;
  const current_refresh_token_hash = refreshToken ? hashRefreshToken(refreshToken) : null;

  const { error } = await supabaseAdmin
    .from('users')
    .update({ current_access_token_hash, current_refresh_token_hash })
    .eq('auth_user_id', authUserId);

  if (error) {
    if (
      error.code === 'PGRST204' ||
      error.message?.includes('current_access_token_hash') ||
      error.message?.includes('current_refresh_token_hash')
    ) {
      return;
    }
    throw error;
  }
}

export async function clearCurrentTokenHashes(authUserId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ current_access_token_hash: null, current_refresh_token_hash: null })
    .eq('auth_user_id', authUserId);

  if (error) {
    if (
      error.code === 'PGRST204' ||
      error.message?.includes('current_access_token_hash') ||
      error.message?.includes('current_refresh_token_hash')
    ) {
      return;
    }
    throw error;
  }
}