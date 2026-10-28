import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDict } from '@/i18n';
import { createClient } from '@/lib/supabase/server';
import { NotificationSettings } from '@/components/NotificationSettings';
import { markAllRead, markRead } from '@/app/notif-actions';

export const dynamic = 'force-dynamic';
export default async function NotificationsPage() {
  const a = await requireUser('/account/notifications'); const { t } = await getDict();
  const { data } = await (await createClient()).from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  const list = data ?? [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="font-bold">{t.account.notifications}</h2>
        {list.some((n) => !n.read_at) && <form action={markAllRead}><input type="hidden" name="back" value="/account/notifications" /><button className="text-sm font-semibold text-brand">{t.account.markAll}</button></form>}</div>
      {list.length === 0 ? <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">{t.account.noNotifs}</p> : (
        <ul className="divide-y rounded-2xl border border-neutral-200">
          {list.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 p-4 ${n.read_at ? '' : 'bg-brand-soft/50'}`}>
              <div className="min-w-0 flex-1">
                {n.link ? <Link href={n.link} className="font-semibold hover:text-brand">{n.title}</Link> : <p className="font-semibold">{n.title}</p>}
                {n.body && <p className="truncate text-sm text-neutral-600">{n.body}</p>}
                <p className="mt-1 text-xs text-neutral-400">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
              </div>
              {!n.read_at && <form action={markRead}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="back" value="/account/notifications" /><button className="min-h-9 text-xs font-semibold text-brand">{t.account.markRead}</button></form>}
            </li>))}
        </ul>)}
      <NotificationSettings userId={a.user.id} events={['new_request', 'new_message', 'new_registration', 'contact_message', 'request_updated', 'status_changed', 'reply', 'request_received']} />
    </div>
  );
}
