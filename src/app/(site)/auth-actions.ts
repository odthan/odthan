'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/env';
import { getDict } from '@/i18n';
import { forgotSchemaOnly, loginSchema, registerSchema, firstError } from '@/lib/validation';
import type { FormState } from '@/components/ui';

const safeNext = (n: FormDataEntryValue | null) => { const v = String(n ?? ''); return v.startsWith('/') && !v.startsWith('//') ? v : '/account'; };

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const p = loginSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: t.auth.invalid };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) return { error: t.auth.invalid };
  redirect(safeNext(fd.get('next')));
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const { t, lang } = await getDict();
  const p = registerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.full_name, country: p.data.country ?? '', lang }, emailRedirectTo: `${SITE_URL}/auth/callback?next=/account` },
  });
  if (error) return { error: error.message.includes('weak') ? t.auth.passwordHint : t.common.error };
  if (data.session) redirect('/account');   // seulement si le projet Supabase n'exige pas la confirmation e-mail
  return { ok: t.auth.checkEmail };
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const p = forgotSchemaOnly.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: t.auth.invalid };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(p.data.email, { redirectTo: `${SITE_URL}/auth/callback?next=/reset-password` });
  return { ok: t.auth.resetSent };   // même message que l'adresse existe ou non
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const pw = String(fd.get('password') ?? '');
  if (pw.length < 8 || pw.length > 72) return { error: t.auth.passwordHint };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: t.auth.invalid };
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) return { error: t.common.error };
  await supabase.auth.signOut();
  redirect('/login?reset=1');
}
