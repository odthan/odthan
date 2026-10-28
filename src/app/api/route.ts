import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);   // RLS : uniquement ses propres abonnements
  return NextResponse.json({ ok: true });
}
