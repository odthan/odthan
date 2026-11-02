'use client';
import type { ReactNode } from 'react';
import { SOCIAL_PATHS } from '@/lib/social-icons';

/** Icône de plateforme : image personnalisée si fournie, sinon glyphe de marque. */
export function SocialGlyph({ platform, iconUrl, className = 'h-6 w-6' }: { platform: string; iconUrl?: string | null; className?: string }) {
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt="" className={`${className} object-contain`} />;
  }
  const d = SOCIAL_PATHS[platform] ?? SOCIAL_PATHS.link;
  if (platform === 'link') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={d} /></svg>);
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d={d} /></svg>;
}

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
/** Mesure du clic : uniquement si le visiteur a accepté la mesure d'audience (même consentement que le reste du site). */
function sendClick(socialLinkId: string) {
  try {
    if (localStorage.getItem('infglo-consent') !== 'yes') return;
    let v = localStorage.getItem('infglo-vid'); if (!v) { v = rid(); localStorage.setItem('infglo-vid', v); }
    let s = sessionStorage.getItem('infglo-sid'); if (!s) { s = rid(); sessionStorage.setItem('infglo-sid', s); }
    const body = JSON.stringify({ social_link_id: socialLinkId, path: location.pathname, visitor_id: v, session_id: s });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/sosyal/click', new Blob([body], { type: 'application/json' }));
    else fetch('/api/sosyal/click', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
  } catch { /* la mesure ne doit jamais casser le site */ }
}

export function SocialButton({ id, url, name, className, children }: { id: string; url: string; name: string; className?: string; children: ReactNode }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Swiv nou sou ${name}`} className={className} onClick={() => sendClick(id)}>
      {children}
    </a>
  );
}
