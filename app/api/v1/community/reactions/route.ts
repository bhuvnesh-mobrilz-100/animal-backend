import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server-supabase';
import { getUserFromRequest } from '@/lib/server-auth';

const validReactions = ['like', 'dislike'] as const;
type ReactionType = (typeof validReactions)[number];

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.internalUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const postId = body?.post_id;
  const reaction = body?.reaction as ReactionType;

  if (!postId || !validReactions.includes(reaction)) {
    return NextResponse.json({ error: 'post_id and valid reaction are required' }, { status: 400 });
  }

  const existingResult = await supabaseAdmin
    .from('post_likes')
    .select('reaction')
    .eq('post_id', postId)
    .eq('user_id', user.internalUserId)
    .maybeSingle();

  if (existingResult.error) {
    return NextResponse.json({ error: existingResult.error.message }, { status: 500 });
  }

  const existingReaction = existingResult.data;

  if (existingReaction) {
    if (existingReaction.reaction === reaction) {
      const { error } = await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.internalUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabaseAdmin
        .from('post_likes')
        .update({ reaction })
        .eq('post_id', postId)
        .eq('user_id', user.internalUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  } else {
    const { error } = await supabaseAdmin
      .from('post_likes')
      .insert([{ post_id: postId, user_id: user.internalUserId, reaction }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const countsResult = await supabaseAdmin
    .from('post_likes')
    .select('reaction', { count: 'exact', head: false })
    .eq('post_id', postId);

  if (countsResult.error) {
    return NextResponse.json({ error: countsResult.error.message }, { status: 500 });
  }

  const reactions = (countsResult.data || []) as Array<{ reaction: string }>;
  const likes_count = reactions.filter((item) => item.reaction === 'like').length;
  const dislikes_count = reactions.filter((item) => item.reaction === 'dislike').length;

  return NextResponse.json({ likes_count, dislikes_count, reaction: existingReaction?.reaction === reaction ? null : reaction });
}
