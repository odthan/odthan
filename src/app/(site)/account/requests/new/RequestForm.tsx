'use client';
import { useEffect, useRef, useState } from 'react';
import { useSafeAction } from '@/components/useSafeAction';
import Link from 'next/link';
import { Field, Input, Select, Textarea } from '@/components/fields';
import { SubmitButton } from '@/components/ui';
import { createRequest } from './actions';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/components/Analytics';
import type { Dict } from '@/i18n/fr';

const OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

export function RequestForm({ t, service, defaults, userId }: {
  t: Dict; service: { id: string; name: string }; userId: string;
  defaults: { name: string; email: string; phone: string; country: string; city: string };
}) {
  const { state, onSubmit, pending } = useSafeAction(createRequest);
  const files = useRef<File[]>([]);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [upMsg, setUpMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.id) return;
    track({ type: 'request_submitted', path: '/account/requests/new', service_id: service.id });
    (async () => {
      const supabase = createClient(); let failed = 0;
      for (const f of files.current) {
        const path = `${userId}/${state.id}/${crypto.randomUUID()}.${EXT[f.type]}`;
        const up = await supabase.storage.from('request-attachments').upload(path, f, { contentType: f.type });
        if (up.error) { failed++; continue; }
        const { error } = await supabase.from('request_attachments').insert({ request_id: state.id, storage_path: path, file_name: f.name.slice(0, 200), mime_type: f.type, size_bytes: f.size });
        if (error) failed++;
      }
      if (failed) setUpMsg(`${failed} pièce(s) jointe(s) n’ont pas pu être envoyées. Vous pourrez les ajouter par message.`);
    })();
  }, [state?.id, service.id, userId]);

  if (state?.id) return (
    <div className="mt-6 space-y-4 rounded-2xl border border-green-200 bg-green-50 p-5" role="status">
      <p className="font-semibold text-green-900">{t.request.sent} {state.reference}</p>
      {upMsg && <p className="text-sm text-amber-800">{upMsg}</p>}
      <Link href={`/account/requests/${state.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-ink px-5 font-semibold text-white">{t.account.requests}</Link>
    </div>
  );
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <input type="hidden" name="service_id" value={service.id} />
      <Field label={t.request.service}><Input value={service.name} readOnly disabled /></Field>
      <Field label={t.request.project}><Input name="project_name" required minLength={2} maxLength={150} /></Field>
      <Field label={t.request.description}><Textarea name="description" required minLength={10} maxLength={5000} rows={5} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.request.country}><Input name="country" required defaultValue={defaults.country} maxLength={80} /></Field>
        <Field label={t.request.city}><Input name="city" defaultValue={defaults.city} maxLength={80} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><Field label={t.request.budget}><Input name="budget_amount" type="number" min={0} step="any" inputMode="decimal" /></Field></div>
        <Field label={t.request.currency}><Select name="budget_currency" defaultValue=""><option value="">—</option><option>USD</option><option>HTG</option><option>DOP</option><option>EUR</option></Select></Field>
      </div>
      <Field label={t.request.deadline}><Input name="desired_date" type="date" /></Field>
      <Field label={t.request.contactName}><Input name="contact_name" required defaultValue={defaults.name} maxLength={120} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.request.contactEmail}><Input name="contact_email" type="email" required defaultValue={defaults.email} maxLength={200} /></Field>
        <Field label={t.request.contactPhone}><Input name="contact_phone" type="tel" defaultValue={defaults.phone} maxLength={40} /></Field>
      </div>
      <Field label={t.request.attachments}>
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="block w-full text-sm"
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []); setFileErr(null);
            const bad = list.find((f) => !OK.includes(f.type) || f.size > 5 * 1024 * 1024);
            if (bad || list.length > 5) { setFileErr(`Fichier refusé (${bad?.name ?? 'maximum 5 fichiers'}) : PDF/JPG/PNG/WEBP, 5 Mo max.`); e.target.value = ''; files.current = []; return; }
            files.current = list;
          }} />
      </Field>
      {fileErr && <p role="alert" className="text-sm text-red-700">{fileErr}</p>}
      {state?.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton busy={pending} className="w-full sm:w-auto" pending={t.common.sending}>{t.request.submit}</SubmitButton>
    </form>
  );
}
