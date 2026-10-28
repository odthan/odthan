'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { isAudioUnlocked, onAudioState, unlockAudio } from '@/lib/sound';

export type NavItem = { href: string; label: string; icon: string };

function SoundPrompt() {
  const [locked, setLocked] = useState(false); const [hide, setHide] = useState(false);
  useEffect(() => { setLocked(!isAudioUnlocked()); return onAudioState(() => setLocked(!isAudioUnlocked())); }, []);
  if (!locked || hide) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
      <span>Touchez pour autoriser les alertes sonores sur cet appareil.</span>
      <span className="flex gap-2"><button onClick={() => void unlockAudio()} className="min-h-10 rounded-lg bg-brand px-4 font-semibold text-white">Activer les alertes sonores</button>
        <button onClick={() => setHide(true)} className="min-h-10 rounded-lg px-3 text-neutral-600">Plus tard</button></span>
    </div>
  );
}

export function AdminShell({ items, userId, userName, unread, logout, children }: {
  items: NavItem[]; userId: string; userName: string; unread: number; logout: () => void | Promise<void>; children: ReactNode;
}) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (h: string) => (h === '/admin' ? path === '/admin' : path.startsWith(h));
  const bottom = items.slice(0, 4);
  const Item = ({ i }: { i: NavItem }) => (
    <Link href={i.href} aria-current={active(i.href) ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active(i.href) ? 'bg-brand text-white' : 'text-neutral-300 hover:bg-white/10'}`}>
      <Icon name={i.icon} className="h-5 w-5" />{i.label}
    </Link>
  );
  return (
    <div className="min-h-screen bg-mist md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink p-4 md:flex md:sticky md:top-0 md:h-screen">
        <Logo href="/admin" dark sub="Administration" />
        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Administration">{items.map((i) => <Item key={i.href} i={i} />)}</nav>
        <form action={logout}><button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-neutral-400 hover:bg-white/10"><Icon name="logout" className="h-5 w-5" />Déconnexion</button></form>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 bg-ink px-3 pt-[env(safe-area-inset-top)] md:static md:h-16 md:bg-white md:px-6 md:pt-0">
          <div className="md:hidden"><Logo href="/admin" dark /></div>
          <p className="hidden text-sm text-neutral-500 md:block">Bonjour, <span className="font-semibold text-ink">{userName}</span></p>
          <div className="flex items-center gap-1">
            <span className="md:hidden"><NotificationBell userId={userId} initialUnread={unread} href="/admin/notifications" dark /></span>
            <span className="hidden md:block"><NotificationBell userId={userId} initialUnread={unread} href="/admin/notifications" /></span>
            <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="flex h-11 w-11 items-center justify-center rounded-xl text-white md:hidden"><Icon name={open ? 'x' : 'menu'} /></button>
          </div>
        </header>
        {open && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-20 overflow-y-auto bg-ink p-4 md:hidden" role="dialog" aria-label="Menu">
            <nav className="flex flex-col gap-1">{items.map((i) => <Item key={i.href} i={i} />)}</nav>
            <form action={logout} className="mt-4"><button className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-neutral-300"><Icon name="logout" />Déconnexion</button></form>
          </div>
        )}
        <main className="mx-auto max-w-6xl p-4 pb-28 md:p-6 md:pb-10"><SoundPrompt />{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navigation rapide">
          {bottom.map((i) => (
            <Link key={i.href} href={i.href} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active(i.href) ? 'text-brand' : 'text-neutral-300'}`}><Icon name={i.icon} className="h-5 w-5" />{i.label}</Link>))}
          <button onClick={() => setOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-neutral-300"><Icon name="menu" className="h-5 w-5" />Plus</button>
        </nav>
      </div>
    </div>
  );
}
