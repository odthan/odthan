'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const OK: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

/** Téléverse directement vers Supabase Storage (jamais de Base64 en base). Le champ caché reçoit uniquement le nom de fichier. */
export function ImageUpload({ bucket, name, label, initial }: { bucket: 'service-media' | 'category-media'; name: string; label: string; initial?: string | null }) {
  const [path, setPath] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const url = path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` : null;

  async function onFile(f: File | undefined) {
    if (!f) return; setErr(null);
    const ext = OK[f.type];
    if (!ext) return setErr('Format refusé : JPG, PNG, WEBP ou SVG.');
    if (f.size > 2 * 1024 * 1024) return setErr('Image trop lourde (2 Mo maximum).');
    setBusy(true);
    const file = `${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from(bucket).upload(file, f, { contentType: f.type, cacheControl: '3600' });
    setBusy(false);
    if (error) return setErr('Téléversement impossible (connexion ou droits).');
    setPath(file);
  }
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={path} />
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-mist text-xs text-neutral-400">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : 'Aucune'}
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold">
          {busy ? 'Envoi…' : path ? 'Remplacer' : 'Choisir une image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {path && <button type="button" onClick={() => setPath('')} className="text-sm text-neutral-500 underline">Retirer</button>}
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    </div>
  );
}
