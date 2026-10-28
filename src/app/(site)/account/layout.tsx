import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDict } from '@/i18n';
import { createClient } from '@/lib/supabase/server';
import { NotificationBell } from '@/components/NotificationBell';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const a = await requireUser('/account');
  const { t } = await getDict();
  const supabase = await createClient();
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  const tabs = [{ href: '/account', l: t.account.title }, { href: '/account/requests', l: t.account.requests }, { href: '/account/profile', l: t.account.profile }, { href: '/account/notifications', l: t.account.notifications }];
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t.account.title}</h1>
        <NotificationBell userId={a.user.id} initialUnread={count ?? 0} href="/account/notifications" />
      </div>
      <nav className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Compte">
        {tabs.map((x) => <Link key={x.href} href={x.href} className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-brand">{x.l}</Link>)}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
