import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const schema = z.object({ endpoint: z.string().url().max(1000).startsWith('https://'), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const admin = createAdminClient();   // un même appareil peut changer de compte : on remplace l'ancien abonnement
    await admin.from('push_subscriptions').delete().eq('endpoint', p.data.endpoint);
    const { error } = await admin.from('push_subscriptions').insert({
      user_id: user.id, endpoint: p.data.endpoint, p256dh: p.data.keys.p256dh, auth: p.data.keys.auth,
      user_agent: (req.headers.get('user-agent') ?? '').slice(0, 200),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'server' }, { status: 500 }); }
}
