import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Appelé par un Database Webhook Supabase (INSERT sur public.notifications). Protégé par un secret partagé. */
export async function POST(req: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET; const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const priv = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !pub || !priv) return NextResponse.json({ error: 'push not configured' }, { status: 503 });
  const given = Buffer.from(req.headers.get('x-webhook-secret') ?? ''); const want = Buffer.from(secret);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as { type?: string; record?: { id: string; user_id: string; title: string; body: string | null; link: string | null; type: string } } | null;
  const n = body?.record; if (body?.type !== 'INSERT' || !n?.user_id) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contact@odthan.com', pub, priv);
  const admin = createAdminClient();
  const { data: prefs } = await admin.from('notification_preferences').select('push_enabled').eq('user_id', n.user_id).maybeSingle();
  if (prefs && !prefs.push_enabled) return NextResponse.json({ sent: 0 });
  const { data: subs } = await admin.from('push_subscriptions').select('id,endpoint,p256dh,auth').eq('user_id', n.user_id);
  const payload = JSON.stringify({ id: n.id, title: n.title, body: n.body ?? '', url: n.link ?? '/' });
  let sent = 0, removed = 0, failed = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 }); sent++; }
    catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) { await admin.from('push_subscriptions').delete().eq('id', s.id); removed++; } else failed++;
    }
  }));
  return NextResponse.json({ sent, removed, failed });
}
