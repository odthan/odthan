import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Empty, Forbidden, PageHead } from '@/components/admin-ui';
import { cleanQuery } from '@/lib/data';

export const metadata = { title: 'Clients' };
export default async function ClientsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await checkPerm('clients.view'))) return <Forbidden />;
  const sp = await searchParams; const supabase = await createClient();
  let q = supabase.from('profiles').select('id,full_name,email,country,phone,created_at,deletion_requested_at').order('created_at', { ascending: false }).limit(200);
  const t = cleanQuery(sp.q ?? ''); if (t) q = q.or(`full_name.ilike.%${t}%,email.ilike.%${t}%,country.ilike.%${t}%`);
  const { data } = await q;
  return (
    <>
      <PageHead title="Clients" sub={`${(data ?? []).length} compte(s) affiché(s)`} />
      <form className="mb-4 flex gap-2" role="search"><input name="q" defaultValue={sp.q} placeholder="Nom, e-mail, pays…" className="min-h-11 flex-1 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm" /><button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">Rechercher</button></form>
      {(data ?? []).length === 0 ? <Empty>Aucun compte.</Empty> : <ul className="space-y-3">{data!.map((c) => (
        <li key={c.id}><Card><p className="font-bold">{c.full_name || '(sans nom)'} {c.deletion_requested_at && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Suppression demandée</span>}</p>
          <p className="text-sm text-neutral-600">{c.email}{c.phone ? ` · ${c.phone}` : ''}{c.country ? ` · ${c.country}` : ''}</p><p className="text-xs text-neutral-400">Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')}</p></Card></li>))}</ul>}
    </>
  );
}
