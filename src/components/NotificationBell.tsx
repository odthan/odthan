'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Icon } from './Icon';
import { armAutoUnlock, playAlert } from '@/lib/sound';

type Prefs = { sound_enabled: boolean; volume: number; sound_events: string[] };
type Notif = { id: string; type: string; title: string; body: string | null; link: string | null };
const DEFAULT: Prefs = { sound_enabled: true, volume: 0.7, sound_events: [] };

/** Cloche + compteur + toast + son. Ne réagit qu'aux événements Realtime ARRIVÉS après le chargement : jamais aux anciens. */
export function NotificationBell({ userId, initialUnread, href, dark = false, adaptive = false }: { userId: string; initialUnread: number; href: string; dark?: boolean; adaptive?: boolean }) {
  const [unread, setUnread] = useState(initialUnread);
  const [toast, setToast] = useState<Notif | null>(null);
  const prefs = useRef<Prefs | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCount = useCallback(async () => {
    const { count } = await createClient().from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
    if (typeof count === 'number') setUnread(count);
  }, []);

  useEffect(() => {
    armAutoUnlock();
    const supabase = createClient();
    let alive = true;
    supabase.from('notification_preferences').select('sound_enabled,volume,sound_events').eq('user_id', userId).maybeSingle()
      .then(({ data }: { data: unknown }) => { if (alive) prefs.current = (data as Prefs) ?? null; });

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
    channel = supabase.channel(`notif-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload: { new: unknown }) => {
        const n = payload.new as Notif;
        if (seen.current.has(n.id)) return;            // anti-doublon
        seen.current.add(n.id);
        setUnread((u) => u + 1);
        setToast(n);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setToast(null), 6000);
        const p = prefs.current ?? DEFAULT;
        const allowed = !prefs.current || prefs.current.sound_events.length === 0 || prefs.current.sound_events.includes(n.type);
        if (p.sound_enabled && allowed) playAlert(Number(p.volume));
        if ('vibrate' in navigator) navigator.vibrate?.(120);
      })
      .subscribe();
    } catch { /* le temps réel est facultatif : la page ne doit jamais planter */ }
    const onVis = () => { if (document.visibilityState === 'visible') void refreshCount(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); if (channel) supabase.removeChannel(channel); };
  }, [userId, refreshCount]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread]);

  return (
    <>
      <Link href={href} aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${adaptive ? 'text-white hover:bg-white/10 md:border md:border-neutral-300 md:text-ink md:hover:bg-mist' : dark ? 'text-white hover:bg-white/10' : 'border border-neutral-300'}`}>
        <Icon name="bell" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>}
      </Link>
      {toast && (
        <Link href={toast.link ?? href} onClick={() => setToast(null)} role="status" aria-live="polite"
          className="fixed inset-x-3 top-3 z-[60] mx-auto flex max-w-md animate-slide items-start gap-3 rounded-2xl border-l-4 border-brand bg-white p-4 text-ink shadow-2xl">
          <Icon name="bell" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <span className="min-w-0"><span className="block text-sm font-bold">{toast.title}</span>{toast.body && <span className="block truncate text-sm text-neutral-600">{toast.body}</span>}</span>
        </Link>
      )}
    </>
  );
}
