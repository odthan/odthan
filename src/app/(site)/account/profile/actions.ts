'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getDict } from '@/i18n';
import { profileSchema, firstError } from '@/lib/validation';
import type { FormState } from '@/components/ui';

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const a = await requireUser('/account/profile'); const { t } = await getDict();
  const p = profileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const { error } = await (await createClient()).from('profiles').update(p.data).eq('id', a.user.id);
  if (error) return { error: t.common.error };
  (await cookies()).set('lang', p.data.preferred_language, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  revalidatePath('/account', 'layout');
  return { ok: t.account.saved };
}
export async function requestDeletion(_: FormState): Promise<FormState> {
  const a = await requireUser('/account/profile'); const { t } = await getDict();
  const { error } = await (await createClient()).from('profiles').update({ deletion_requested_at: new Date().toISOString() }).eq('id', a.user.id);
  if (error) return { error: t.common.error };
  revalidatePath('/account/profile');
  return { ok: t.account.deleteDone };
}
