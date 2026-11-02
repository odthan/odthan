'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAccess, logActivity } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { firstError } from '@/lib/validation';
import { socialSchema } from '@/lib/sosyal-data';
import type { FormState } from '@/components/ui';

/** Réservé au SUPER_ADMIN (permission social.manage) — vérifié ici ET par RLS en base. */
async function need() {
  const a = await getAccess();
  if (!a.user) redirect('/login');
  if (!a.permissions.includes('social.manage')) throw new Error('forbidden');
  return a;
}
const TO = '/admin/sosyal';
const flash: (kind: 'm' | 'e', msg: string) => never = (kind, msg) => redirect(`${TO}?${kind}=${encodeURIComponent(msg)}`);
const iconPath = (v: FormDataEntryValue | null) => { const s = String(v ?? ''); return /^[0-9a-f-]{36}\.(png|jpg|webp|svg)$/.test(s) ? s : null; };
const refresh = () => { revalidatePath('/', 'layout'); revalidatePath(TO); };

export async function saveSocial(_: FormState, fd: FormData): Promise<FormState> {
  await need();
  const p = socialSchema.safeParse({ name: fd.get('name'), platform: fd.get('platform'), url: fd.get('url') });
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient(); const id = String(fd.get('id') ?? '');
  const row = { ...p.data, icon_path: iconPath(fd.get('icon_path')), is_active: fd.get('is_active') === 'on' };
  let res;
  if (id) res = await supabase.from('social_links').update(row).eq('id', id).select('id');
  else {
    const { data: last } = await supabase.from('social_links').select('sort_order').order('sort_order', { ascending: false }).limit(1);
    res = await supabase.from('social_links').insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 10 }).select('id');
  }
  if (res.error || !res.data?.length) return { error: 'Enregistrement refusé (droits ou connexion).' };
  await logActivity(id ? 'social.update' : 'social.create', 'social', res.data[0].id, { name: p.data.name });
  refresh(); flash('m', 'Plateforme enregistrée.');
}
export async function toggleSocial(fd: FormData) {
  await need(); const id = String(fd.get('id')); const active = fd.get('active') === '1';
  const { error } = await (await createClient()).from('social_links').update({ is_active: active }).eq('id', id);
  if (error) flash('e', 'Action refusée.');
  await logActivity(active ? 'social.activate' : 'social.deactivate', 'social', id); refresh();
  flash('m', active ? 'Plateforme activée : visible sur le site.' : 'Plateforme désactivée : masquée sur le site.');
}
export async function deleteSocial(fd: FormData) {
  await need(); const id = String(fd.get('id'));
  const { error } = await (await createClient()).from('social_links').delete().eq('id', id);
  if (error) flash('e', 'Suppression refusée.');
  await logActivity('social.delete', 'social', id); refresh(); flash('m', 'Plateforme supprimée.');
}
export async function moveSocial(fd: FormData) {
  await need(); const id = String(fd.get('id')); const up = fd.get('dir') === 'up';
  const supabase = await createClient();
  const { data } = await supabase.from('social_links').select('id').order('sort_order').order('name');
  const ids = (data ?? []).map((r) => r.id as string); const i = ids.indexOf(id); const j = up ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < ids.length) {
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await Promise.all(ids.map((x, k) => supabase.from('social_links').update({ sort_order: (k + 1) * 10 }).eq('id', x)));
  }
  await logActivity('social.reorder', 'social', id); refresh(); redirect(TO);
}
