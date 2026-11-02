import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { socialIconUrl } from '@/lib/sosyal-data';
import { Card, Empty, Flash, Forbidden, PageHead } from '@/components/admin-ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SocialGlyph } from '@/components/SocialButton';
import { SocialForm } from './SocialForm';
import { SOSYAL_ADMIN } from '@/lib/sosyal';
import { deleteSocial, moveSocial, toggleSocial } from './actions';

export const metadata = { title: SOSYAL_ADMIN };
export default async function SosyalAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string; edit?: string }> }) {
  const a = await requireStaff(); if (!a.permissions.includes('social.manage')) return <Forbidden />;
  const sp = await searchParams; const supabase = await createClient();
  const now = new Date();
  const [{ data: links }, { data: summary }] = await Promise.all([
    supabase.from('social_links').select('*').order('sort_order').order('name'),
    supabase.rpc('analytics_summary', { p_from: new Date(now.getTime() - 30 * 86400000).toISOString(), p_to: new Date(now.getTime() + 86400000).toISOString() }),
  ]);
  const clicks = new Map<string, number>(((summary as { top_social?: { label: string; value: number }[] } | null)?.top_social ?? []).map((r) => [r.label, r.value]));
  const list = links ?? []; const editing = list.find((l) => l.id === sp.edit);
  return (
    <>
      <PageHead title={SOSYAL_ADMIN} sub="Section publique « SWIV NOU SOU ». Réservé au SUPER_ADMIN. Les clics ne sont comptés que pour les visiteurs ayant accepté la mesure d’audience." />
      <Flash m={sp.m} e={sp.e} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {list.length === 0 && <Empty>Aucune plateforme. Ajoutez-en une avec le formulaire.</Empty>}
          {list.map((l, i) => (
            <Card key={l.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white"><SocialGlyph platform={l.platform} iconUrl={socialIconUrl(l.icon_path)} className="h-6 w-6" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{l.name} {!l.is_active && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Désactivée</span>}</p>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-brand underline">{l.url}</a>
                  <p className="mt-1 text-xs text-neutral-500">{clicks.get(l.name) ?? 0} clic(s) · 30 derniers jours</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a href={`/admin/sosyal?edit=${l.id}`} className="inline-flex min-h-10 items-center rounded-lg border px-3 font-semibold">Modifier</a>
                <form action={toggleSocial}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="active" value={l.is_active ? '0' : '1'} /><button className="min-h-10 rounded-lg border px-3 font-semibold">{l.is_active ? 'Désactiver' : 'Activer'}</button></form>
                <form action={moveSocial}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} aria-label="Monter" className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30">↑</button></form>
                <form action={moveSocial}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === list.length - 1} aria-label="Descendre" className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30">↓</button></form>
                <form action={deleteSocial}><input type="hidden" name="id" value={l.id} /><ConfirmButton message={`Supprimer « ${l.name} » ? Ses clics enregistrés resteront dans les statistiques anonymes.`} className="min-h-10 rounded-lg border border-red-300 px-3 font-semibold text-red-700">Supprimer</ConfirmButton></form>
              </div>
            </Card>))}
        </div>
        <Card className="h-fit"><h2 className="mb-3 font-bold">{editing ? `Modifier : ${editing.name}` : 'Nouvelle plateforme'}</h2><SocialForm key={editing?.id ?? 'new'} s={editing} /></Card>
      </div>
    </>
  );
}
