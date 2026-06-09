import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromRequest } from '@/lib/server-auth';
import { clearCurrentTokenHashes } from '@/lib/auth-session';
import { supabaseAdmin } from '@/lib/server-supabase';

export async function POST(request: NextRequest) {
  const token = await getTokenFromRequest(request);
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (token) {
    try {
      await supabaseAdmin.auth.admin.signOut(token, 'local');
    } catch (error) {
      // Token may already be expired or revoked; clear server state anyway.
      console.warn('Logout signOut error:', error);
    }
  }

  await clearCurrentTokenHashes(user.id);

  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
