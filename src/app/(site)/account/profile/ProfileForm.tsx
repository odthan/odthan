'use client';
import { useActionState } from 'react';
import { useSafeAction } from '@/components/useSafeAction';
import { Field, Input, Select } from '@/components/fields';
import { FormMsg, SubmitButton } from '@/components/ui';
import { requestDeletion, updateProfile } from './actions';
import type { Dict } from '@/i18n/fr';

export function ProfileForm({ t, email, p }: { t: Dict; email: string; p: { full_name: string; phone: string; country: string; city: string; preferred_language: string } }) {
  const { state, onSubmit, pending } = useSafeAction(updateProfile);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t.auth.email}><Input value={email} readOnly disabled /></Field>
      <Field label={t.auth.fullName}><Input name="full_name" defaultValue={p.full_name} required minLength={2} maxLength={120} /></Field>
      <Field label={t.account.phone}><Input name="phone" type="tel" defaultValue={p.phone} maxLength={40} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.auth.country}><Input name="country" defaultValue={p.country} maxLength={80} /></Field>
        <Field label={t.account.city}><Input name="city" defaultValue={p.city} maxLength={80} /></Field>
      </div>
      <Field label={t.account.language}><Select name="preferred_language" defaultValue={p.preferred_language}><option value="fr">Français</option><option value="ht">Kreyòl ayisyen</option></Select></Field>
      <FormMsg state={state} />
      <SubmitButton busy={pending}>{t.account.save}</SubmitButton>
    </form>
  );
}
export function DeleteAccountForm({ t, requested }: { t: Dict; requested: boolean }) {
  const [state, action] = useActionState(requestDeletion, null);
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4"
      onSubmit={(e) => { if (!confirm(t.account.deleteAccount + ' ?')) e.preventDefault(); }}>
      <p className="text-sm text-neutral-700">{t.account.deleteInfo}</p>
      <FormMsg state={state ?? (requested ? { ok: t.account.deleteDone } : null)} />
      {!requested && !state?.ok && <SubmitButton className="bg-white !text-red-700 border border-red-300 hover:!bg-red-50">{t.account.deleteAccount}</SubmitButton>}
    </form>
  );
}
