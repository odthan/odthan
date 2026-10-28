import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Diagnostic de configuration : aucune clé n'est affichée, uniquement des indicateurs. À supprimer une fois la mise en route terminée. */
export async function GET() {
  const out: Record<string, unknown> = {
    env: {
      supabase_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anon_key: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      service_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      site_url: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    },
  };
  try {
    const s = await createClient();
    const c = await s.from('service_categories').select('id', { count: 'exact', head: true });
    out.categories = c.error ? c.error.message : c.count;
    const v = await s.from('services').select('id', { count: 'exact', head: true });
    out.services = v.error ? v.error.message : v.count;
    const { data: { user } } = await s.auth.getUser();
    out.logged_in = Boolean(user);
    if (user) { const a = await s.rpc('my_access'); out.my_access = a.error ? a.error.message : a.data; }
  } catch (e) { out.exception = String((e as Error)?.message ?? e); }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
