'use client';
import { Field, Input, Select, Textarea } from '@/components/fields';
import { FormMsg, SubmitButton } from '@/components/ui';
import { useSafeAction } from '@/components/useSafeAction';
import { saveSettings } from '../actions';

export function SettingsForm({ s }: { s: Record<string, any> }) {
  const { state, onSubmit, pending } = useSafeAction(saveSettings);
  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-2xl border bg-white p-4">
      <Field label="Nom de la plateforme"><Input name="name" maxLength={80} defaultValue={s.site?.name ?? 'ODTHAN'} /></Field>
      <Field label="Signature"><Input name="tagline" maxLength={120} defaultValue={s.site?.tagline ?? ''} /></Field>
      <Field label="Description"><Textarea name="description" rows={3} maxLength={500} defaultValue={s.site?.description ?? ''} /></Field>
      <Field label="Numéro WhatsApp (avec indicatif)" hint="Le lien wa.me est généré automatiquement."><Input name="whatsapp_number" inputMode="tel" defaultValue={s.contact?.whatsapp_number ?? '50940894038'} required /></Field>
      <Field label="E-mail d’assistance"><Input name="support_email" type="email" maxLength={200} defaultValue={s.contact?.support_email ?? ''} /></Field>
      <Field label="Horaires d’assistance"><Input name="support_hours" maxLength={200} defaultValue={s.contact?.support_hours ?? ''} placeholder="Lun–Ven 8h–17h" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Langue par défaut"><Select name="default_language" defaultValue={s.locale?.default_language ?? 'fr'}><option value="fr">Français</option><option value="ht">Kreyòl ayisyen</option></Select></Field>
        <Field label="Fuseau horaire"><Input name="timezone" defaultValue={s.locale?.timezone ?? 'America/Port-au-Prince'} /></Field>
      </div>
      <Field label="Titre SEO"><Input name="seo_title" maxLength={120} defaultValue={s.seo?.title ?? ''} /></Field>
      <Field label="Description SEO"><Textarea name="seo_description" rows={2} maxLength={300} defaultValue={s.seo?.description ?? ''} /></Field>
      <FormMsg state={state} /><SubmitButton busy={pending}>Enregistrer</SubmitButton>
    </form>
  );
}
