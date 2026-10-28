'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function cancelRequest(fd: FormData) {
  const id = String(fd.get('id') ?? '');
  await requireUser(`/account/requests/${id}`);
  // RLS : seul le propriétaire peut passer sa propre demande (statuts précoces) à « cancelled »
  await (await createClient()).from('service_requests').update({ status: 'cancelled' }).eq('id', id);
  redirect(`/account/requests/${id}`);
}
