import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { rangeFor } from '@/lib/analytics-range';
import { Card, Empty, Forbidden, PageHead, Stat } from '@/components/admin-ui';

export const metadata = { title: 'Analytique' };
type Row = { label: string; value: number };
type Summary = { visitors: number; sessions: number; page_views: number; service_views: number; signups: number; requests: number; service_view_sessions: number; conversion_pct: number | null;
  daily: { day: string; page_views: number; sessions: number }[]; top_pages: Row[]; top_services: Row[]; top_categories: Row[]; sources: Row[]; campaigns: Row[]; devices: Row[]; browsers: Row[]; countries: Row[] };

function BarList({ title, rows, empty = 'Aucune donnée mesurée.' }: { title: string; rows: Row[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (<Card><h2 className="mb-3 font-bold">{title}</h2>{rows.length === 0 ? <p className="text-sm text-neutral-500">{empty}</p> : (
    <ul className="space-y-2">{rows.map((r) => (<li key={r.label} className="text-sm"><div className="flex justify-between gap-2"><span className="truncate">{r.label}</span><span className="font-semibold">{r.value}</span></div>
      <div className="mt-1 h-1.5 rounded-full bg-neutral-100"><div className="h-1.5 rounded-full bg-brand" style={{ width: `${(r.value / max) * 100}%` }} /></div></li>))}</ul>)}</Card>);
}
function Daily({ data }: { data: Summary['daily'] }) {
  const max = Math.max(1, ...data.map((d) => d.page_views)); const w = 100 / Math.max(1, data.length);
  return (<Card><h2 className="mb-3 font-bold">Pages vues par jour</h2>
    <div className="overflow-x-auto"><svg viewBox="0 0 400 140" className="h-40 w-full min-w-[300px]" role="img" aria-label="Pages vues par jour">
      {data.map((d, i) => { const h = (d.page_views / max) * 110; const x = (i * 400) / Math.max(1, data.length);
        return (<g key={d.day}><rect x={x + 2} y={120 - h} width={Math.max(2, 400 / Math.max(1, data.length) - 4)} height={h} rx="2" fill="#E10D0D"><title>{`${d.day} : ${d.page_views} pages vues, ${d.sessions} sessions`}</title></rect>
          {data.length <= 14 && <text x={x + 400 / data.length / 2} y="135" fontSize="8" textAnchor="middle" fill="#737373">{d.day.slice(5)}</text>}</g>); })}
    </svg></div></Card>);
}

export default async function AnalyticsAdmin({ searchParams }: { searchParams: Promise<{ r?: string; from?: string; to?: string }> }) {
  if (!(await checkPerm('analytics.view'))) return <Forbidden />;
  const sp = await searchParams; const rg = rangeFor(sp.r, sp.from, sp.to);
  const { data, error } = await (await createClient()).rpc('analytics_summary', { p_from: rg.from.toISOString(), p_to: rg.to.toISOString() });
  const s = data as Summary | null;
  const tabs: [string, string][] = [['today', 'Aujourd’hui'], ['7d', '7 jours'], ['30d', '30 jours'], ['year', 'Cette année']];
  const active = sp.r ?? '7d';
  return (
    <>
      <PageHead title="Analytique" sub={`${rg.label} · jours calculés en UTC · uniquement les visiteurs ayant accepté la mesure`} />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">{tabs.map(([k, v]) => <a key={k} href={`?r=${k}`} className={`rounded-full border px-4 py-2 font-medium ${active === k ? 'bg-ink text-white' : 'bg-white'}`}>{v}</a>)}</div>
      <form className="mb-5 flex flex-wrap items-end gap-2 text-sm"><input type="hidden" name="r" value="custom" />
        <label>Du<input type="date" name="from" defaultValue={sp.from} required className="ml-2 min-h-11 rounded-xl border border-neutral-300 px-2" /></label>
        <label>Au<input type="date" name="to" defaultValue={sp.to} required className="ml-2 min-h-11 rounded-xl border border-neutral-300 px-2" /></label>
        <button className="min-h-11 rounded-xl bg-ink px-4 font-semibold text-white">Période personnalisée</button></form>
      {error || !s ? <Empty>Analytique indisponible pour le moment.</Empty> : (<>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Visiteurs uniques" value={s.visitors} hint="appareils distincts" /><Stat label="Sessions" value={s.sessions} /><Stat label="Pages vues" value={s.page_views} /><Stat label="Consultations de services" value={s.service_views} />
          <Stat label="Comptes inscrits" value={s.signups} /><Stat label="Demandes envoyées" value={s.requests} tone="brand" />
          <Stat label="Taux de conversion" value={s.conversion_pct === null ? '—' : `${s.conversion_pct} %`} hint={`demandes ÷ sessions ayant consulté un service (${s.service_view_sessions})`} />
        </div>
        {s.page_views === 0 && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Aucun événement mesuré sur cette période. Les statistiques apparaissent quand des visiteurs acceptent la mesure d’audience.</p>}
        <div className="mt-5 space-y-4"><Daily data={s.daily} />
          <div className="grid gap-4 md:grid-cols-2"><BarList title="Pages les plus consultées" rows={s.top_pages} /><BarList title="Services les plus consultés" rows={s.top_services} /><BarList title="Catégories populaires" rows={s.top_categories} />
            <BarList title="Sources de trafic (sessions)" rows={s.sources} /><BarList title="Campagnes UTM" rows={s.campaigns} empty="Aucune campagne UTM mesurée." /><BarList title="Appareils" rows={s.devices} /><BarList title="Navigateurs" rows={s.browsers} /><BarList title="Pays (via l’hébergeur)" rows={s.countries} empty="Pays non disponibles." /></div></div>
      </>)}
    </>
  );
}
