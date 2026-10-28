import Link from 'next/link';
import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { BtnLink, Card, Empty, Flash, Forbidden, PageHead } from '@/components/admin-ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { cleanQuery } from '@/lib/data';
import { deleteService, moveService, setServiceStatus, toggleServiceActive } from '../actions';

export const metadata = { title: 'Services' };
const ST: Record<string, [string, string]> = { published: ['Publié', 'bg-green-100 text-green-900'], draft: ['Brouillon', 'bg-neutral-200 text-neutral-700'], unpublished: ['Dépublié', 'bg-amber-100 text-amber-900'] };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; sort?: string; m?: string; e?: string }> }) {
  if (!(await checkPerm('services.manage'))) return <Forbidden />;
  const sp = await searchParams; const supabase = await createClient();
  let q = supabase.from('services').select('id,slug,name,status,is_active,is_featured,sort_order,updated_at,category_id,service_categories(name)');
  if (sp.cat) q = q.eq('category_id', sp.cat);
  const term = cleanQuery(sp.q ?? ''); if (term) q = q.or(`name.ilike.%${term}%,slug.ilike.%${term}%,short_description.ilike.%${term}%`);
  q = sp.sort === 'name' ? q.order('name') : sp.sort === 'updated' ? q.order('updated_at', { ascending: false }) : q.order('sort_order').order('name');
  const [{ data }, { data: cats }] = await Promise.all([q, supabase.from('service_categories').select('id,name').order('sort_order')]);
  const here = `/admin/services${Object.keys(sp).filter((k) => ['q', 'cat', 'sort'].includes(k)).length ? '?' + new URLSearchParams(Object.entries(sp).filter(([k]) => ['q', 'cat', 'sort'].includes(k)) as [string, string][]) : ''}`;
  const orderable = !sp.q && !sp.cat && !sp.sort;
  return (
    <>
      <PageHead title="Services" action={<BtnLink href="/admin/services/new">+ Ajouter un service</BtnLink>} />
      <Flash m={sp.m} e={sp.e} />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Rechercher un service…" className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm" />
        <select name="cat" defaultValue={sp.cat ?? ''} className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm"><option value="">Toutes catégories</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="sort" defaultValue={sp.sort ?? ''} className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm"><option value="">Ordre d’affichage</option><option value="name">Nom (A→Z)</option><option value="updated">Dernière modification</option></select>
        <button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">Filtrer</button>
      </form>
      {!orderable && <p className="mb-3 text-xs text-neutral-500">Le changement d’ordre est disponible sans filtre ni tri.</p>}
      {(data ?? []).length === 0 ? <Empty>Aucun service. Utilisez « + Ajouter un service ».</Empty> : (
        <ul className="space-y-3">
          {data!.map((s: any, i) => {
            const [label, tone] = ST[s.status];
            return (
              <li key={s.id}><Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><Link href={`/admin/services/${s.id}`} className="block truncate text-base font-bold hover:text-brand">{s.name}</Link>
                    <p className="text-xs text-neutral-500">{s.service_categories?.name ?? 'Sans catégorie'} · /{s.slug} · modifié {new Date(s.updated_at).toLocaleDateString('fr-FR')}</p></div>
                  <div className="flex gap-1.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>{!s.is_active && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Désactivé</span>}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <Link href={`/admin/services/${s.id}`} className="inline-flex min-h-10 items-center rounded-lg border px-3 font-semibold">Modifier</Link>
                  {s.status !== 'published' ? <form action={setServiceStatus}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value="published" /><input type="hidden" name="back" value={here} /><button className="min-h-10 rounded-lg bg-brand px-3 font-semibold text-white">Publier</button></form>
                    : <form action={setServiceStatus}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value="unpublished" /><input type="hidden" name="back" value={here} /><button className="min-h-10 rounded-lg border px-3 font-semibold">Dépublier</button></form>}
                  <form action={toggleServiceActive}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={s.is_active ? '0' : '1'} /><input type="hidden" name="back" value={here} /><button className="min-h-10 rounded-lg border px-3 font-semibold">{s.is_active ? 'Désactiver' : 'Réactiver'}</button></form>
                  {orderable && <>
                    <form action={moveService}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} aria-label="Monter" className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30">↑</button></form>
                    <form action={moveService}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === data!.length - 1} aria-label="Descendre" className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30">↓</button></form></>}
                  <form action={deleteService}><input type="hidden" name="id" value={s.id} /><ConfirmButton message={`Supprimer définitivement « ${s.name} » ?`} className="min-h-10 rounded-lg border border-red-300 px-3 font-semibold text-red-700">Supprimer</ConfirmButton></form>
                </div>
              </Card></li>);
          })}
        </ul>)}
    </>
  );
}
