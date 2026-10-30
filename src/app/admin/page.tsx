import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Empty, PageHead, Pill, Stat } from '@/components/admin-ui';
import { BtnLink } from '@/components/admin-ui';

export const metadata = { title: 'Dashboard' };
export default async function Dashboard() {
  const a = await requireStaff(); const can = (p: string) => a.permissions.includes(p); const supabase = await createClient();
  const cnt = async (q: any) => (await q).count ?? 0;
  const head = { count: 'exact' as const, head: true };
  const now = new Date(); const from = new Date(now.getTime() - 30 * 86400000);
  const [pubServices, activeCats, clients, reqTotal, reqNew, reqDone, summary, recent, logs] = await Promise.all([
    can('services.manage') ? cnt(supabase.from('services').select('id', head).eq('status', 'published').eq('is_active', true)) : null,
    can('categories.manage') || can('services.manage') ? cnt(supabase.from('service_categories').select('id', head).eq('is_active', true)) : null,
    can('clients.view') ? cnt(supabase.from('profiles').select('id', head)) : null,
    can('requests.view') ? cnt(supabase.from('service_requests').select('id', head)) : null,
    can('requests.view') ? cnt(supabase.from('service_requests').select('id', head).eq('status', 'new')) : null,
    can('requests.view') ? cnt(supabase.from('service_requests').select('id', head).eq('status', 'completed')) : null,
    can('analytics.view') ? supabase.rpc('analytics_summary', { p_from: from.toISOString(), p_to: new Date(now.getTime() + 86400000).toISOString() }).then((r) => r.data as any) : null,
    can('requests.view') ? supabase.from('service_requests').select('id,reference,project_name,status,created_at').order('created_at', { ascending: false }).limit(5).then((r) => r.data ?? []) : null,
    can('logs.view') ? supabase.from('admin_activity_logs').select('id,action,entity,created_at').order('created_at', { ascending: false }).limit(5).then((r) => r.data ?? []) : null,
  ]);
  const S = (label: string, v: number | null, extra?: { tone?: 'brand'; hint?: string }) => (v === null ? null : <Stat label={label} value={v} {...extra} />);
  return (
    <>
      <PageHead title="Dashboard" sub="Chiffres calculés à partir des données réelles de la base." action={can('services.manage') ? <BtnLink href="/admin/services/new">+ Ajouter un service</BtnLink> : undefined} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {S('Services publiés', pubServices)}{S('Catégories actives', activeCats)}{S('Comptes clients', clients)}{S('Demandes reçues', reqTotal)}
        {S('Demandes non traitées', reqNew, { tone: 'brand', hint: 'statut « Nouvelle »' })}{S('Demandes terminées', reqDone)}
        {summary && <Stat label="Visites (30 j)" value={summary.page_views} hint="pages vues mesurées" />}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {recent && <Card><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Demandes récentes</h2><Link href="/admin/requests" className="text-sm font-semibold text-brand">Tout voir</Link></div>
          {recent.length === 0 ? <p className="text-sm text-neutral-500">Aucune demande pour le moment.</p> : <ul className="divide-y">{recent.map((r: any) => <li key={r.id}><Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between gap-2 py-3"><span className="min-w-0"><span className="block truncate font-medium">{r.project_name}</span><span className="text-xs text-neutral-500">{r.reference}</span></span><Pill s={r.status} /></Link></li>)}</ul>}</Card>}
        {summary && <Card><h2 className="mb-3 font-bold">Services les plus consultés (30 j)</h2>{summary.top_services.length === 0 ? <p className="text-sm text-neutral-500">Aucune consultation mesurée.</p> : <ol className="space-y-2 text-sm">{summary.top_services.slice(0, 5).map((s: any) => <li key={s.label} className="flex justify-between"><span>{s.label}</span><strong>{s.value}</strong></li>)}</ol>}</Card>}
        {logs && <Card><h2 className="mb-3 font-bold">Activité récente de l’administration</h2>{logs.length === 0 ? <p className="text-sm text-neutral-500">Aucune activité.</p> : <ul className="space-y-2 text-sm">{logs.map((l: any) => <li key={l.id}><span className="font-medium">{l.action}</span> <span className="text-xs text-neutral-400">{new Date(l.created_at).toLocaleString('fr-FR')}</span></li>)}</ul>}</Card>}
      </div>
      {!pubServices && !reqTotal && !summary && !recent && <Empty>Bienvenue. Utilisez le menu pour accéder à vos sections.</Empty>}
    </>
  );
}
