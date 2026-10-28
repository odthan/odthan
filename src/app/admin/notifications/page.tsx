import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty, PageHead } from '@/components/admin-ui';
import { NotificationSettings } from '@/components/NotificationSettings';
import { markAllRead, markRead } from '@/app/notif-actions';

export const metadata = { title: 'Notifications' };
export default async function NotificationsAdmin() {
  const a = await requireStaff();
  const { data } = await (await createClient()).from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  const list = data ?? [];
  return (
    <>
      <PageHead title="Notifications" action={list.some((n) => !n.read_at) ? <form action={markAllRead}><input type="hidden" name="back" value="/admin/notifications" /><button className="min-h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold">Tout marquer comme lu</button></form> : undefined} />
      {list.length === 0 ? <Empty>Aucune notification.</Empty> : <ul className="divide-y overflow-hidden rounded-2xl border bg-white">{list.map((n) => (
        <li key={n.id} className={`flex items-start gap-3 p-4 ${n.read_at ? '' : 'bg-brand-soft/60'}`}><div className="min-w-0 flex-1">
          {n.link ? <Link href={n.link} className="font-semibold hover:text-brand">{n.title}</Link> : <p className="font-semibold">{n.title}</p>}{n.body && <p className="truncate text-sm text-neutral-600">{n.body}</p>}
          <p className="mt-1 text-xs text-neutral-400">{new Date(n.created_at).toLocaleString('fr-FR')}</p></div>
          {!n.read_at && <form action={markRead}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="back" value="/admin/notifications" /><button className="min-h-10 text-xs font-semibold text-brand">Marquer comme lu</button></form>}</li>))}</ul>}
      <div className="mt-6"><NotificationSettings userId={a.user.id} events={['new_request', 'new_message', 'new_registration', 'contact_message', 'request_updated']} /></div>
    </>
  );
}
