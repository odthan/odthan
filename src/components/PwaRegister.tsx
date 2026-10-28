'use client';
import { useEffect, useState } from 'react';

/** Enregistre le service worker (production uniquement) et propose la mise à jour quand une nouvelle version est prête. */
export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) setWaiting(w); });
      });
    }).catch(() => { /* non bloquant */ });
  }, []);
  if (!waiting) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg md:bottom-4">
      <span>Une nouvelle version est disponible.</span>
      <button onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })} className="rounded-lg bg-brand px-3 py-1.5 font-semibold">Mettre à jour</button>
    </div>
  );
}
