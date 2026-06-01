import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getTokenFromRequest } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as any;

    if (action === 'logout') {
      const token = await getTokenFromRequest(request);

      if (token) {
        const { data } = await supabaseAdmin.auth.getUser(token);
        const authUserId = data.user?.id;

        if (authUserId) {
          await supabaseAdmin
            .from('users')
            .update({ current_access_token_hash: null })
            .eq('auth_user_id', authUserId);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
