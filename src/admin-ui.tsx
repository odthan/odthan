import Link from 'next/link';
import type { ReactNode } from 'react';
export function PageHead({ title, action, sub }: { title: string; sub?: string; action?: ReactNode }) {
  return (<div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold">{title}</h1>{sub && <p className="text-sm text-neutral-500">{sub}</p>}</div>{action}</div>);
}
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'brand' }) {
  return (<Card><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p><p className={`mt-1 text-3xl font-extrabold ${tone === 'brand' ? 'text-brand' : ''}`}>{value}</p>{hint && <p className="text-xs text-neutral-400">{hint}</p>}</Card>);
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">{children}</div>;
export const BtnLink = ({ href, children, variant = 'brand' }: { href: string; children: ReactNode; variant?: 'brand' | 'ghost' }) => (
  <Link href={href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ${variant === 'brand' ? 'bg-brand text-white hover:bg-brand-dark' : 'border border-neutral-300 bg-white hover:border-brand'}`}>{children}</Link>);
export function Forbidden() {
  return (<div className="mx-auto max-w-md py-20 text-center"><p className="text-5xl font-extrabold text-brand">403</p><h1 className="mt-3 text-xl font-bold">Accès refusé</h1><p className="mt-2 text-neutral-600">Votre rôle ne permet pas d’ouvrir cette section.</p><BtnLink href="/admin" variant="ghost">Retour au dashboard</BtnLink></div>);
}
export const STATUS_FR: Record<string, string> = { new: 'Nouvelle', analyzing: 'En cours d’analyse', info_required: 'Infos supplémentaires requises', quote_sent: 'Devis envoyé', accepted: 'Acceptée', in_progress: 'En cours de réalisation', completed: 'Terminée', cancelled: 'Annulée' };
export const STATUS_TONE: Record<string, string> = { new: 'bg-brand text-white', analyzing: 'bg-amber-100 text-amber-900', info_required: 'bg-amber-100 text-amber-900', quote_sent: 'bg-blue-100 text-blue-900', accepted: 'bg-green-100 text-green-900', in_progress: 'bg-blue-100 text-blue-900', completed: 'bg-green-600 text-white', cancelled: 'bg-neutral-200 text-neutral-700' };
export const Pill = ({ s }: { s: string }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[s] ?? 'bg-neutral-100'}`}>{STATUS_FR[s] ?? s}</span>;
export function Flash({ m, e }: { m?: string; e?: string }) {
  if (e) return <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{e}</p>;
  if (m) return <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{m}</p>;
  return null;
}
