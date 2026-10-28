'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const KEY = 'infglo-consent';
const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
function ids() {
  let v = localStorage.getItem('infglo-vid'); if (!v) { v = rid(); localStorage.setItem('infglo-vid', v); }
  let s = sessionStorage.getItem('infglo-sid'); if (!s) { s = rid(); sessionStorage.setItem('infglo-sid', s); }
  return { visitor_id: v, session_id: s };
}
export function track(payload: Record<string, unknown>) {
  try {
    if (localStorage.getItem(KEY) !== 'yes') return;           // aucune mesure sans consentement explicite
    const p = new URLSearchParams(location.search);
    const body = JSON.stringify({ ...payload, ...ids(), referrer: document.referrer || null,
      utm_source: p.get('utm_source'), utm_medium: p.get('utm_medium'), utm_campaign: p.get('utm_campaign') });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
  } catch { /* la mesure ne doit jamais casser le site */ }
}
export function PageTracker() {
  const path = usePathname();
  useEffect(() => { track({ type: 'page_view', path }); }, [path]);
  return null;
}
export function ServiceViewTracker({ serviceId, categoryId }: { serviceId: string; categoryId: string | null }) {
  useEffect(() => { track({ type: 'service_view', path: location.pathname, service_id: serviceId, category_id: categoryId }); }, [serviceId, categoryId]);
  return null;
}
export function ConsentBanner({ text, accept, decline, privacy }: { text: string; accept: string; decline: string; privacy: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(!localStorage.getItem(KEY)); }, []);
  if (!show) return null;
  const choose = (v: 'yes' | 'no') => { localStorage.setItem(KEY, v); setShow(false); if (v === 'yes') track({ type: 'page_view', path: location.pathname }); };
  return (
    <div role="dialog" aria-label="Consentement" className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl animate-slide rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
      <p className="text-sm text-neutral-700">{text} <a href="/privacy" className="font-medium text-brand underline">{privacy}</a></p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => choose('yes')} className="min-h-10 flex-1 rounded-xl bg-ink px-4 text-sm font-semibold text-white">{accept}</button>
        <button onClick={() => choose('no')} className="min-h-10 flex-1 rounded-xl border border-neutral-300 px-4 text-sm font-semibold">{decline}</button>
      </div>
    </div>
  );
}
