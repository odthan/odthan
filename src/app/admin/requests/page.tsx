import Link from 'next/link';
import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty, Forbidden, PageHead, Pill, STATUS_FR, Card } from '@/components/admin-ui';
import { cleanQuery } from '@/lib/data';

export const metadata = { title: 'Demandes clients' };
export default async function RequestsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; service?: string }> }) {
  if (!(await checkPerm('requests.view'))) return <Forbidden />;
  const sp = await searchParams; const supabase = await createClient();
  let q = supabase.from('service_requests').select('id,reference,project_name,service_name,status,country,contact_name,created_at').order('created_at', { ascending: false }).limit(200);
  if (sp.status && STATUS_FR[sp.status]) q = q.eq('status', sp.status);
  const t = cleanQuery(sp.q ?? ''); if (t) q = q.or(`reference.ilike.%${t}%,project_name.ilike.%${t}%,contact_name.ilike.%${t}%,service_name.ilike.%${t}%`);
  const { data } = await q;
  return (
    <>
      <PageHead title="Demandes clients" />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Référence, projet, client, service…" className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm" />
        <select name="status" defaultValue={sp.status ?? ''} className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm"><option value="">Tous les statuts</option>{Object.entries(STATUS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">Filtrer</button>
      </form>
      {(data ?? []).length === 0 ? <Empty>Aucune demande{sp.q || sp.status ? ' pour ce filtre' : ' reçue pour le moment'}.</Empty> : (
        <ul className="space-y-3">{data!.map((r) => (
          <li key={r.id}><Link href={`/admin/requests/${r.id}`}><Card className="transition hover:border-brand">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-bold">{r.project_name}</p><p className="text-xs text-neutral-500">{r.reference} · {r.service_name} · {r.contact_name} · {r.country}</p></div><Pill s={r.status} /></div>
            <p className="mt-1 text-xs text-neutral-400">{new Date(r.created_at).toLocaleString('fr-FR')}</p></Card></Link></li>))}</ul>)}
    </>
  );
}
