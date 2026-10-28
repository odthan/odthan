import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminShell, type NavItem } from '@/components/AdminShell';
import { logout } from '@/app/actions';

export const metadata: Metadata = { title: { default: 'Administration', template: '%s | ODTHAN Admin' }, robots: { index: false, follow: false }, manifest: '/manifest.webmanifest' };
export const dynamic = 'force-dynamic';

const NAV: (NavItem & { perm?: string })[] = [
  { href: '/admin', label: 'Dashboard', icon: 'home' },
  { href: '/admin/services', label: 'Services', icon: 'grid', perm: 'services.manage' },
  { href: '/admin/requests', label: 'Demandes', icon: 'inbox', perm: 'requests.view' },
  { href: '/admin/categories', label: 'Catégories', icon: 'tag', perm: 'categories.manage' },
  { href: '/admin/clients', label: 'Clients', icon: 'users', perm: 'clients.view' },
  { href: '/admin/contact', label: 'Messages contact', icon: 'mail', perm: 'contact.manage' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/admin/analytics', label: 'Analytique', icon: 'chart', perm: 'analytics.view' },
  { href: '/admin/users', label: 'Utilisateurs & rôles', icon: 'shield', perm: 'users.manage' },
  { href: '/admin/settings', label: 'Paramètres', icon: 'settings', perm: 'settings.manage' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const a = await requireStaff();   // non connecté → /login ; connecté sans rôle staff → /account
  const supabase = await createClient();
  const [{ count }, { data: p }] = await Promise.all([
    supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
    supabase.from('profiles').select('full_name').eq('id', a.user.id).maybeSingle(),
  ]);
  const items = NAV.filter((i) => !i.perm || a.permissions.includes(i.perm)).map(({ perm, ...i }) => i);
  return <AdminShell items={items} userId={a.user.id} userName={p?.full_name || a.user.email || 'Admin'} unread={count ?? 0} logout={logout}>{children}</AdminShell>;
}
