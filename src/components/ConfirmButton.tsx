'use client';
import type { ReactNode } from 'react';
/** Bouton de formulaire demandant une confirmation avant l'envoi (suppression, désactivation…). */
export function ConfirmButton({ message, children, className = '' }: { message: string; children: ReactNode; className?: string }) {
  return <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}
