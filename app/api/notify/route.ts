import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Use Node.js runtime (web-push needs Node crypto)
export const runtime = 'nodejs';

webpush.setVapidDetails(
  'mailto:maroon.shalbak@consensys.net',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { tripId, event, title, body, actorId } = await request.json();
    if (!tripId || !event) return NextResponse.json({ ok: true });

    // Service-role client bypasses RLS so we can read other users' subscriptions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all participants of this trip (excluding the actor)
    const { data: participants } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId);

    const recipientIds = (participants ?? [])
      .map((p: { user_id: string }) => p.user_id)
      .filter((uid: string) => uid !== actorId);

    if (!recipientIds.length) return NextResponse.json({ ok: true });

    // Find recipients who have opted OUT of this event type
    const { data: optedOut } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .in('user_id', recipientIds)
      .eq(event, false);

    const optedOutIds = new Set((optedOut ?? []).map((p: { user_id: string }) => p.user_id));
    const eligibleIds = recipientIds.filter((uid: string) => !optedOutIds.has(uid));

    if (!eligibleIds.length) return NextResponse.json({ ok: true });

    // Get push subscriptions for eligible recipients
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', eligibleIds);

    if (!subs?.length) return NextResponse.json({ ok: true });

    const payload = JSON.stringify({ title, body, tag: event });

    // Fire and forget — ignore individual send failures
    await Promise.allSettled(
      subs.map(({ subscription }: { subscription: webpush.PushSubscription }) =>
        webpush.sendNotification(subscription, payload)
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notify]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
