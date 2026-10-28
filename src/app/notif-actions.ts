'use server';
import { redirect } from 'next/navigation';
import { getAccess } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const back = (fd: FormData) => { const b = String(fd.get('back') ?? '/'); return b.startsWith('/') && !b.startsWith('//') ? b : '/'; };
export async function markRead(fd: FormData) {
  if (!(await getAccess()).user) redirect('/login');
  await (await createClient()).from('notifications').update({ read_at: new Date().toISOString() }).eq('id', String(fd.get('id'))).is('read_at', null);
  redirect(back(fd));
}
export async function markAllRead(fd: FormData) {
  if (!(await getAccess()).user) redirect('/login');
  await (await createClient()).from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);   // RLS limite aux siennes
  redirect(back(fd));
}
