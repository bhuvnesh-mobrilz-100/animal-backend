import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: userRecord, error: userError } = await supabaseAdmin
    .from('users')
    .select('user_id, auth_user_id')
    .eq('user_id', user.internalUserId)
    .single();

  if (userError || !userRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const authUserId = userRecord.auth_user_id;
  const internalUserId = userRecord.user_id;

  try {
    // Delete owned entities
    for (const table of ['service_providers', 'vets', 'breeders', 'pet_friendly_places']) {
      await supabaseAdmin.from(table).delete().eq('user_id', internalUserId);
    }

    // Delete transactions
    await supabaseAdmin.from('transactions').delete().eq('user_id', internalUserId);

    // Delete user_roles (though CASCADE on user delete handles this)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', internalUserId);

    // Delete internal user
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', internalUserId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Delete Supabase Auth user
    if (authUserId) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (authDeleteError) {
        console.error('Failed to delete auth user:', authDeleteError.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Account permanently deleted' });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}
