'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { requestSchema, firstError } from '@/lib/validation';
import { getDict } from '@/i18n';

export type CreateState = { error?: string; id?: string; reference?: string } | null;
export async function createRequest(_: CreateState, fd: FormData): Promise<CreateState> {
  const a = await requireUser('/account/requests'); const { t } = await getDict();
  const p = requestSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: firstError(p.error) };
  const { data, error } = await (await createClient()).from('service_requests')
    .insert({ ...p.data, user_id: a.user.id, service_name: '' })   // service_name est réécrit par un trigger SQL à partir du service réel
    .select('id,reference').single();
  if (error || !data) return { error: error?.message.includes('accepte pas') ? t.request.unavailable : t.common.error };
  revalidatePath('/account/requests');
  return { id: data.id, reference: data.reference };
}
