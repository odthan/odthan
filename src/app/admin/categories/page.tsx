import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Empty, Flash, Forbidden, PageHead } from '@/components/admin-ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { CategoryForm } from './CategoryForm';
import { deleteCategory, moveCategory, toggleCategory } from '../actions';

export const metadata = { title: 'Catégories' };
export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string; edit?: string }> }) {
  if (!(await checkPerm('categories.manage'))) return <Forbidden />;
  const sp = await searchParams; const supabase = await createClient();
  const [{ data: cats }, { data: svc }] = await Promise.all([supabase.from('service_categories').select('*').order('sort_order').order('name'), supabase.from('services').select('category_id')]);
  const count = (id: string) => (svc ?? []).filter((s) => s.category_id === id).length;
  const editing = (cats ?? []).find((c) => c.id === sp.edit);
  return (
    <>
      <PageHead title="Catégories" sub="Modifiables à tout moment : le site public se met à jour automatiquement." />
      <Flash m={sp.m} e={sp.e} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {(cats ?? []).length === 0 && <Empty>Aucune catégorie.</Empty>}
          {(cats ?? []).map((c, i) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-bold">{c.name} {!c.is_active && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Désactivée</span>}</p>
                  <p className="text-xs text-neutral-500">/{c.slug} · {count(c.id)} service(s)</p>{c.description && <p className="mt-1 text-sm text-neutral-600">{c.description}</p>}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a href={`/admin/categories?edit=${c.id}`} className="inline-flex min-h-10 items-center rounded-lg border px-3 font-semibold">Modifier</a>
                <form action={toggleCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={c.is_active ? '0' : '1'} />
                  {c.is_active ? <ConfirmButton message={`Désactiver « ${c.name} » ? ${count(c.id)} service(s) rattaché(s) ne seront plus visibles publiquement (ils ne sont pas supprimés).`} className="min-h-10 rounded-lg border px-3 font-semibold">Désactiver</ConfirmButton>
                    : <button className="min-h-10 rounded-lg border px-3 font-semibold">Réactiver</button>}</form>
                <form action={moveCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} aria-label="Monter" className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30">↑</button></form>
                <form action={moveCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === cats!.length - 1} aria-label="Descendre" className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30">↓</button></form>
                <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Supprimer « ${c.name} » ?`} className="min-h-10 rounded-lg border border-red-300 px-3 font-semibold text-red-700">Supprimer</ConfirmButton></form>
              </div>
            </Card>))}
        </div>
        <Card className="h-fit"><h2 className="mb-3 font-bold">{editing ? `Modifier : ${editing.name}` : 'Nouvelle catégorie'}</h2><CategoryForm key={editing?.id ?? 'new'} c={editing} /></Card>
      </div>
    </>
  );
}
