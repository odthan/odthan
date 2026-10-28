'use client';
import { useSafeAction } from '@/components/useSafeAction';
import { submitContact } from '@/app/actions';
import { Field, Input, Textarea } from '@/components/fields';
import { FormMsg, SubmitButton } from '@/components/ui';
import type { Dict } from '@/i18n/fr';

export function ContactForm({ t }: { t: Dict['contact'] }) {
  const { state, onSubmit, pending } = useSafeAction(submitContact);
  const sent = state?.ok === 'sent';
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {sent ? <FormMsg state={{ ok: t.sent }} /> : <>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <Field label={t.name}><Input name="name" required minLength={2} maxLength={120} autoComplete="name" /></Field>
        <Field label={t.email}><Input type="email" name="email" required maxLength={200} autoComplete="email" /></Field>
        <Field label={t.phone}><Input type="tel" name="phone" maxLength={40} autoComplete="tel" /></Field>
        <Field label={t.subject}><Input name="subject" maxLength={150} /></Field>
        <Field label={t.message}><Textarea name="message" required minLength={5} maxLength={4000} rows={5} /></Field>
        <FormMsg state={state} />
        <SubmitButton busy={pending} className="w-full sm:w-auto">{t.send}</SubmitButton>
      </>}
    </form>
  );
}
