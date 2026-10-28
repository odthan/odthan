'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Field, Input, Select, Textarea } from '@/components/fields';
import { FormMsg } from '@/components/ui';
import { ImageUpload } from '@/components/ImageUpload';
import { useSafeAction } from '@/components/useSafeAction';
import { saveService } from '../actions';

const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
export type ServiceRow = Partial<{ id: string; name: string; slug: string; category_id: string | null; short_description: string; description: string | null; official_url: string | null;
  countries: string[]; languages: string[]; pricing_type: string; price: number | null; currency: string | null; contact_phone: string | null; contact_button_label: string | null;
  contact_button_url: string | null; allow_requests: boolean; is_featured: boolean; sort_order: number; status: string; logo_path: string | null; cover_path: string | null; created_at: string; updated_at: string }>;

export function ServiceForm({ s, categories }: { s?: ServiceRow; categories: { id: string; name: string }[] }) {
  const { state, onSubmit, pending } = useSafeAction(saveService);
  const [name, setName] = useState(s?.name ?? ''); const [slug, setSlug] = useState(s?.slug ?? ''); const [touched, setTouched] = useState(Boolean(s?.slug));
  const [pricing, setPricing] = useState(s?.pricing_type ?? 'quote');
  const edit = Boolean(s?.id);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {edit && <input type="hidden" name="id" value={s!.id} />}
      <div className="space-y-4 rounded-2xl border bg-white p-4">
        <Field label="Nom du service *"><Input name="name" required minLength={2} maxLength={120} value={name} onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} /></Field>
        <Field label="Identifiant URL (slug) *" hint="Adresse : /services/votre-slug — minuscules, chiffres, tirets."><Input name="slug" required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} /></Field>
        <Field label="Catégorie"><Select name="category_id" defaultValue={s?.category_id ?? ''}><option value="">— Sans catégorie —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Description courte * (affichée sur la carte)"><Textarea name="short_description" required minLength={5} maxLength={300} rows={2} defaultValue={s?.short_description ?? ''} /></Field>
        <Field label="Description détaillée"><Textarea name="description" maxLength={8000} rows={6} defaultValue={s?.description ?? ''} /></Field>
      </div>
      <div className="grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-2">
        <ImageUpload bucket="service-media" name="logo_path" label="Logo" initial={s?.logo_path} />
        <ImageUpload bucket="service-media" name="cover_path" label="Image de couverture" initial={s?.cover_path} />
      </div>
      <div className="space-y-4 rounded-2xl border bg-white p-4">
        <Field label="URL officielle" hint="Vérifiée (le site doit répondre) avant toute publication."><Input name="official_url" type="url" inputMode="url" maxLength={500} placeholder="https://" defaultValue={s?.official_url ?? ''} /></Field>
        <Field label="Pays desservis" hint="Séparés par des virgules."><Input name="countries" defaultValue={(s?.countries ?? []).join(', ')} placeholder="Haïti, République dominicaine" /></Field>
        <Field label="Langues disponibles" hint="Séparées par des virgules."><Input name="languages" defaultValue={(s?.languages ?? []).join(', ')} placeholder="Français, Créole haïtien" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tarification"><Select name="pricing_type" value={pricing} onChange={(e) => setPricing(e.target.value)}><option value="quote">Demande de devis</option><option value="indicative">Prix indicatif</option><option value="fixed">Prix fixe</option></Select></Field>
          <Field label="Prix"><Input name="price" type="number" min={0} step="any" inputMode="decimal" disabled={pricing === 'quote'} defaultValue={s?.price ?? ''} /></Field>
          <Field label="Devise"><Select name="currency" disabled={pricing === 'quote'} defaultValue={s?.currency ?? 'USD'}><option>USD</option><option>HTG</option><option>DOP</option><option>EUR</option></Select></Field>
        </div>
        <Field label="Numéro de contact (facultatif)"><Input name="contact_phone" type="tel" maxLength={40} defaultValue={s?.contact_phone ?? ''} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bouton de contact — texte"><Input name="contact_button_label" maxLength={60} defaultValue={s?.contact_button_label ?? ''} /></Field>
          <Field label="Bouton de contact — lien" hint="https://, mailto: ou tel:"><Input name="contact_button_url" maxLength={500} defaultValue={s?.contact_button_url ?? ''} /></Field>
        </div>
        <Field label="Ordre d’affichage" hint="Plus petit = affiché en premier."><Input name="sort_order" type="number" min={0} defaultValue={s?.sort_order ?? 0} /></Field>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" name="allow_requests" defaultChecked={s?.allow_requests ?? true} className="h-5 w-5 accent-brand" /> Autoriser le bouton « Demander ce service »</label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" name="is_featured" defaultChecked={s?.is_featured ?? false} className="h-5 w-5 accent-brand" /> Mettre en avant</label>
        {edit && <p className="text-xs text-neutral-500">Statut actuel : <strong>{s?.status}</strong> · créé le {s?.created_at && new Date(s.created_at).toLocaleString('fr-FR')} · modifié le {s?.updated_at && new Date(s.updated_at).toLocaleString('fr-FR')}</p>}
      </div>
      <FormMsg state={state} />
      <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row md:bottom-4">
        <button name="intent" value="publish" disabled={pending} className="min-h-11 flex-1 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? 'Enregistrement…' : 'Publier'}</button>
        <button name="intent" value="draft" disabled={pending} className="min-h-11 flex-1 rounded-xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60">Enregistrer le brouillon</button>
        {edit && <button name="intent" value="save" disabled={pending} className="min-h-11 flex-1 rounded-xl border border-neutral-300 px-5 text-sm font-semibold disabled:opacity-60">Enregistrer sans changer le statut</button>}
        <Link href="/admin/services" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold">Annuler</Link>
      </div>
    </form>
  );
}
