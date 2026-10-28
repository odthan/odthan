'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAccess, logActivity } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { categorySchema, firstError, serviceSchema, splitList } from '@/lib/validation';
import { ROLES } from '@/lib/permissions';
import type { FormState } from '@/components/ui';

async function need(perm: string) {
  const a = await getAccess();
  if (!a.user) redirect('/login');
  if (!a.permissions.includes(perm)) throw new Error('forbidden');   // RLS refuserait de toute façon
  return a;
}
const backTo = (fd: FormData, fallback: string) => { const b = String(fd.get('back') ?? fallback); return b.startsWith('/admin') ? b : fallback; };
const flash: (to: string, kind: 'm' | 'e', msg: string) => never = (to, kind, msg) => redirect(`${to}${to.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(msg)}`);
const mediaPath = (v: FormDataEntryValue | null) => { const s = String(v ?? ''); return /^[0-9a-f-]{36}\.(png|jpg|webp|svg)$/.test(s) ? s : null; };
const pgMsg = (e: { code?: string; message: string }) =>
  e.code === '23505' ? 'Cet identifiant (slug) est déjà utilisé.' : e.code === '23503' ? 'Élément encore utilisé ailleurs.' : e.code === '42501' || /row-level security|Permission/.test(e.message) ? 'Action non autorisée pour votre rôle.' : e.message;

/** Vérifie qu'une URL officielle répond (anti-SSRF de base : pas d'IP littérale, pas de localhost). */
export async function verifyUrl(url: string): Promise<string | null> {
  try {
    const u = new URL(url); const h = u.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(u.protocol)) return 'Protocole non autorisé.';
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h.includes(':') || /^\d+(\.\d+){3}$/.test(h) || !h.includes('.')) return 'Adresse non autorisée : utilisez un nom de domaine public.';
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 7000);
    const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'ODTHAN-InfGlo-LinkCheck/1.0' } }).finally(() => clearTimeout(t));
    if ((r.status >= 200 && r.status < 400) || [401, 403, 405, 429].includes(r.status)) return null;
    return `Le site officiel répond avec le code ${r.status}.`;
  } catch { return 'Le site officiel est injoignable. Vérifiez l’URL avant de publier.'; }
}

// ---------------- Services ----------------
export async function saveService(_: FormState, fd: FormData): Promise<FormState> {
  const a = await need('services.manage');
  const raw = {
    name: fd.get('name'), slug: fd.get('slug'), category_id: fd.get('category_id'), short_description: fd.get('short_description'),
    description: fd.get('description'), official_url: fd.get('official_url'), countries: splitList(fd.get('countries')), languages: splitList(fd.get('languages')),
    pricing_type: fd.get('pricing_type'), price: fd.get('price'), currency: fd.get('currency'), contact_phone: fd.get('contact_phone'),
    contact_button_label: fd.get('contact_button_label'), contact_button_url: fd.get('contact_button_url'),
    allow_requests: fd.get('allow_requests') === 'on', is_featured: fd.get('is_featured') === 'on', sort_order: fd.get('sort_order') || 0,
  };
  const p = serviceSchema.safeParse(raw);
  if (!p.success) return { error: firstError(p.error) };
  const intent = String(fd.get('intent') ?? 'save');
  if (intent === 'publish') {
    if (p.data.official_url) { const bad = await verifyUrl(p.data.official_url); if (bad) return { error: `Publication bloquée — ${bad} (enregistrez en brouillon si besoin).` }; }
  }
  const row: Record<string, unknown> = { ...p.data, logo_path: mediaPath(fd.get('logo_path')), cover_path: mediaPath(fd.get('cover_path')) };
  if (intent === 'publish') row.status = 'published'; else if (intent === 'draft') row.status = 'draft';
  const supabase = await createClient(); const id = String(fd.get('id') ?? '');
  const res = id ? await supabase.from('services').update(row).eq('id', id).select('id').single()
                 : await supabase.from('services').insert({ ...row, status: row.status ?? 'draft', created_by: a.user!.id }).select('id').single();
  if (res.error) return { error: pgMsg(res.error) };
  await logActivity(id ? 'service.update' : 'service.create', 'service', res.data.id, { name: p.data.name, intent });
  revalidatePath('/', 'layout');
  flash('/admin/services', 'm', intent === 'publish' ? 'Service publié : il est visible sur le site.' : 'Service enregistré.');
}

export async function setServiceStatus(fd: FormData) {
  await need('services.manage'); const to = backTo(fd, '/admin/services');
  const id = String(fd.get('id')); const status = String(fd.get('status'));
  if (!['draft', 'published', 'unpublished'].includes(status)) flash(to, 'e', 'Statut invalide');
  const supabase = await createClient();
  if (status === 'published') {
    const { data: s } = await supabase.from('services').select('official_url').eq('id', id).maybeSingle();
    if (s?.official_url) { const bad = await verifyUrl(s.official_url); if (bad) flash(to, 'e', `Publication bloquée — ${bad}`); }
  }
  const { error } = await supabase.from('services').update({ status }).eq('id', id);
  if (error) flash(to, 'e', pgMsg(error));
  await logActivity(`service.${status}`, 'service', id); revalidatePath('/', 'layout');
  flash(to, 'm', status === 'published' ? 'Service publié.' : status === 'unpublished' ? 'Service dépublié : il n’est plus visible publiquement.' : 'Service repassé en brouillon.');
}
export async function toggleServiceActive(fd: FormData) {
  await need('services.manage'); const to = backTo(fd, '/admin/services'); const id = String(fd.get('id')); const active = fd.get('active') === '1';
  const { error } = await (await createClient()).from('services').update({ is_active: active }).eq('id', id);
  if (error) flash(to, 'e', pgMsg(error));
  await logActivity(active ? 'service.activate' : 'service.deactivate', 'service', id); revalidatePath('/', 'layout');
  flash(to, 'm', active ? 'Service réactivé.' : 'Service désactivé.');
}
export async function deleteService(fd: FormData) {
  await need('services.manage'); const id = String(fd.get('id'));
  const { error } = await (await createClient()).from('services').delete().eq('id', id);
  if (error) flash('/admin/services', 'e', pgMsg(error));
  await logActivity('service.delete', 'service', id); revalidatePath('/', 'layout');
  flash('/admin/services', 'm', 'Service supprimé.');
}
async function reorder(table: 'services' | 'service_categories', id: string, dir: 'up' | 'down') {
  const supabase = await createClient();
  const { data } = await supabase.from(table).select('id').order('sort_order').order('name');
  const ids = (data ?? []).map((r: any) => r.id as string); const i = ids.indexOf(id); const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((x, k) => supabase.from(table).update({ sort_order: (k + 1) * 10 }).eq('id', x)));
}
export async function moveService(fd: FormData) { await need('services.manage'); await reorder('services', String(fd.get('id')), fd.get('dir') === 'up' ? 'up' : 'down'); revalidatePath('/', 'layout'); redirect(backTo(fd, '/admin/services')); }

// ---------------- Catégories ----------------
export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  await need('categories.manage');
  const p = categorySchema.safeParse({ name: fd.get('name'), slug: fd.get('slug'), description: fd.get('description'), icon: fd.get('icon'), sort_order: fd.get('sort_order') || 0 });
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient(); const id = String(fd.get('id') ?? '');
  const row = { ...p.data, image_path: mediaPath(fd.get('image_path')) };
  const res = id ? await supabase.from('service_categories').update(row).eq('id', id) : await supabase.from('service_categories').insert(row);
  if (res.error) return { error: pgMsg(res.error) };
  await logActivity(id ? 'category.update' : 'category.create', 'category', id || p.data.slug); revalidatePath('/', 'layout');
  flash('/admin/categories', 'm', 'Catégorie enregistrée.');
}
export async function toggleCategory(fd: FormData) {
  await need('categories.manage'); const id = String(fd.get('id')); const active = fd.get('active') === '1';
  const { error } = await (await createClient()).from('service_categories').update({ is_active: active }).eq('id', id);
  if (error) flash('/admin/categories', 'e', pgMsg(error));
  await logActivity(active ? 'category.activate' : 'category.deactivate', 'category', id); revalidatePath('/', 'layout');
  flash('/admin/categories', 'm', active ? 'Catégorie réactivée.' : 'Catégorie désactivée : ses services restent enregistrés mais ne sont plus visibles publiquement.');
}
export async function deleteCategory(fd: FormData) {
  await need('categories.manage'); const id = String(fd.get('id')); const supabase = await createClient();
  const { count } = await supabase.from('services').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count) flash('/admin/categories', 'e', `Suppression impossible : ${count} service(s) y sont rattachés. Déplacez-les d’abord, ou désactivez la catégorie.`);
  const { error } = await supabase.from('service_categories').delete().eq('id', id);
  if (error) flash('/admin/categories', 'e', pgMsg(error));
  await logActivity('category.delete', 'category', id); flash('/admin/categories', 'm', 'Catégorie supprimée.');
}
export async function moveCategory(fd: FormData) { await need('categories.manage'); await reorder('service_categories', String(fd.get('id')), fd.get('dir') === 'up' ? 'up' : 'down'); revalidatePath('/', 'layout'); redirect('/admin/categories'); }

// ---------------- Demandes ----------------
export async function updateRequestStatus(fd: FormData) {
  await need('requests.manage'); const id = String(fd.get('id')); const to = `/admin/requests/${id}`; const status = String(fd.get('status'));
  const { data, error } = await (await createClient()).from('service_requests').update({ status }).eq('id', id).select('id');
  if (error || !data?.length) flash(to, 'e', error ? pgMsg(error) : 'Mise à jour refusée.');
  await logActivity('request.status', 'request', id, { status }); flash(to, 'm', 'Statut mis à jour. Le client est notifié.');
}
export async function addNote(fd: FormData) {
  const a = await need('requests.manage'); const id = String(fd.get('id')); const body = String(fd.get('body') ?? '').trim();
  if (!body) flash(`/admin/requests/${id}`, 'e', 'Note vide.');
  const { error } = await (await createClient()).from('request_notes').insert({ request_id: id, author_id: a.user!.id, body: body.slice(0, 4000) });
  if (error) flash(`/admin/requests/${id}`, 'e', pgMsg(error));
  await logActivity('request.note', 'request', id); flash(`/admin/requests/${id}`, 'm', 'Note interne ajoutée (invisible pour le client).');
}
export async function setContactStatus(fd: FormData) {
  await need('contact.manage'); const status = String(fd.get('status'));
  if (!['new', 'read', 'replied', 'archived'].includes(status)) redirect('/admin/contact');
  await (await createClient()).from('contact_messages').update({ status }).eq('id', String(fd.get('id')));
  redirect(backTo(fd, '/admin/contact'));
}

// ---------------- Utilisateurs & rôles ----------------
export async function grantRole(fd: FormData) {
  await need('users.manage'); const email = String(fd.get('email') ?? '').trim().toLowerCase(); const role = String(fd.get('role'));
  if (!ROLES.includes(role as any) || role === 'CLIENT') flash('/admin/users', 'e', 'Rôle invalide.');
  const supabase = await createClient();
  const { data: p } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (!p) flash('/admin/users', 'e', 'Aucun compte avec cet e-mail : la personne doit d’abord créer un compte.');
  const ins = await supabase.from('user_roles').insert({ user_id: p!.id, role });
  if (ins.error) flash('/admin/users', 'e', pgMsg(ins.error));
  await logActivity('role.grant', 'user', p!.id, { role }); flash('/admin/users', 'm', `Rôle ${role} attribué.`);
}
export async function setRoleActive(fd: FormData) {
  await need('users.manage'); const uid = String(fd.get('user_id')); const role = String(fd.get('role')); const active = fd.get('active') === '1';
  const { error } = await (await createClient()).from('user_roles').update({ is_active: active }).eq('user_id', uid).eq('role', role);
  if (error) flash('/admin/users', 'e', pgMsg(error));
  await logActivity(active ? 'role.activate' : 'role.deactivate', 'user', uid, { role }); flash('/admin/users', 'm', active ? 'Accès réactivé.' : 'Accès suspendu.');
}
export async function revokeRole(fd: FormData) {
  await need('users.manage'); const uid = String(fd.get('user_id')); const role = String(fd.get('role'));
  const { error } = await (await createClient()).from('user_roles').delete().eq('user_id', uid).eq('role', role);
  if (error) flash('/admin/users', 'e', pgMsg(error));
  await logActivity('role.revoke', 'user', uid, { role }); flash('/admin/users', 'm', 'Accès révoqué.');
}

// ---------------- Paramètres ----------------
export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const a = await need('settings.manage');
  const s = (k: string, max = 300) => String(fd.get(k) ?? '').trim().slice(0, max);
  const digits = s('whatsapp_number', 20).replace(/\D/g, '');
  if (digits.length < 8) return { error: 'Numéro WhatsApp invalide (indicatif pays inclus, ex. 50940894038).' };
  const email = s('support_email', 200); if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: 'E-mail de support invalide.' };
  const tz = s('timezone', 60); try { new Intl.DateTimeFormat('fr', { timeZone: tz }); } catch { return { error: 'Fuseau horaire invalide (ex. America/Port-au-Prince).' }; }
  const rows = [
    { key: 'site', value: { name: s('name', 80), tagline: s('tagline', 120), description: s('description', 500) } },
    { key: 'contact', value: { whatsapp_number: digits, whatsapp_url: `https://wa.me/${digits}`, support_email: email, support_hours: s('support_hours', 200) } },
    { key: 'locale', value: { default_language: s('default_language', 2) === 'ht' ? 'ht' : 'fr', timezone: tz } },
    { key: 'seo', value: { title: s('seo_title', 120), description: s('seo_description', 300) } },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString(), updated_by: a.user!.id }));
  const { error } = await (await createClient()).from('site_settings').upsert(rows);
  if (error) return { error: pgMsg(error) };
  await logActivity('settings.update', 'settings'); revalidatePath('/', 'layout');
  return { ok: 'Paramètres enregistrés.' };
}
