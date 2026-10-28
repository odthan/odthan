'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { contactSchema, firstError } from '@/lib/validation';
import type { FormState } from '@/components/ui';

export async function setLang(formData: FormData) {
  const lang = formData.get('lang') === 'ht' ? 'ht' : 'fr';
  (await cookies()).set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  const back = String(formData.get('back') ?? '/');
  redirect(back.startsWith('/') && !back.startsWith('//') ? back : '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

const hits = new Map<string, number[]>();
export async function submitContact(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get('website')) return { ok: 'OK' }; // honeypot : les robots remplissent ce champ caché
  const parsed = contactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const ip = ((await headers()).get('x-forwarded-for') ?? 'anon').split(',')[0].trim();
  const now = Date.now(); const recent = (hits.get(ip) ?? []).filter((x) => now - x < 3600_000);
  if (recent.length >= 5) return { error: 'Trop de messages envoyés. Réessayez plus tard.' };
  hits.set(ip, [...recent, now]);
  try {
    const { error } = await createAdminClient().from('contact_messages').insert(parsed.data);
    if (error) throw error;
  } catch { return { error: 'Envoi impossible pour le moment. Utilisez WhatsApp ou réessayez.' }; }
  revalidatePath('/admin/contact');
  return { ok: 'sent' };
}
