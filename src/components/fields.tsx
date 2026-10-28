import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
export const inputCls = 'block w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 sm:text-sm';
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${p.className ?? ''}`} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${inputCls} ${p.className ?? ''}`} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} ${p.className ?? ''}`} />;
