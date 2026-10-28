'use client';
import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

export function SubmitButton({ children, pending: label, className = '', busy }: { children: ReactNode; pending?: string; className?: string; busy?: boolean }) {
  const status = useFormStatus();
  const pending = busy ?? status.pending;
  return (
    <button type="submit" disabled={pending} aria-busy={pending}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
      {pending ? (label ?? '…') : children}
    </button>
  );
}
export function FormMsg({ state }: { state: { error?: string; ok?: string } | null }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{state.ok}</p>;
  return null;
}
export type FormState = { error?: string; ok?: string } | null;
