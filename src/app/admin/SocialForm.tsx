'use client';
import { Field, Input, Select } from '@/components/fields';
import { FormMsg, SubmitButton } from '@/components/ui';
import { SocialImageUpload } from '@/components/SocialImageUpload';
import { useSafeAction } from '@/components/useSafeAction';
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from '@/lib/social-icons';
import { saveSocial } from './actions';

export function SocialForm({ s }: { s?: { id: string; name: string; platform: string; url: string; icon_path: string | null; is_active: boolean } }) {
  const { state, onSubmit, pending } = useSafeAction(saveSocial);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <Field label="Nom affiché *"><Input name="name" required maxLength={40} defaultValue={s?.name ?? ''} placeholder="Facebook" /></Field>
      <Field label="Plateforme (icône) *"><Select name="platform" defaultValue={s?.platform ?? 'link'}>{SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{SOCIAL_LABELS[p]}</option>)}</Select></Field>
      <Field label="Adresse (URL) *" hint="Commence par https://"><Input name="url" type="url" inputMode="url" required maxLength={500} placeholder="https://" defaultValue={s?.url ?? ''} /></Field>
      <SocialImageUpload name="icon_path" label="Icône personnalisée (facultatif, remplace l’icône de la plateforme)" initial={s?.icon_path} />
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} className="h-5 w-5 accent-brand" /> Visible sur le site</label>
      <FormMsg state={state} />
      <SubmitButton busy={pending}>{s ? 'Enregistrer' : 'Ajouter la plateforme'}</SubmitButton>
    </form>
  );
}
