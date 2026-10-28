'use client';
import { useState } from 'react';
import { Field, Input, Textarea } from '@/components/fields';
import { FormMsg, SubmitButton } from '@/components/ui';
import { ImageUpload } from '@/components/ImageUpload';
import { useSafeAction } from '@/components/useSafeAction';
import { saveCategory } from '../actions';

const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
export function CategoryForm({ c }: { c?: { id: string; name: string; slug: string; description: string | null; icon: string | null; image_path: string | null; sort_order: number } }) {
  const { state, onSubmit, pending } = useSafeAction(saveCategory);
  const [name, setName] = useState(c?.name ?? ''); const [slug, setSlug] = useState(c?.slug ?? ''); const [touched, setTouched] = useState(Boolean(c));
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Nom *"><Input name="name" required minLength={2} maxLength={100} value={name} onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} /></Field>
      <Field label="Identifiant URL (slug) *"><Input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} /></Field>
      <Field label="Description"><Textarea name="description" rows={2} maxLength={500} defaultValue={c?.description ?? ''} /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Icône (nom)"><Input name="icon" maxLength={40} defaultValue={c?.icon ?? ''} placeholder="hammer" /></Field><Field label="Ordre"><Input name="sort_order" type="number" min={0} defaultValue={c?.sort_order ?? 0} /></Field></div>
      <ImageUpload bucket="category-media" name="image_path" label="Image" initial={c?.image_path} />
      <FormMsg state={state} /><SubmitButton busy={pending}>{c ? 'Enregistrer' : 'Créer la catégorie'}</SubmitButton>
    </form>
  );
}
