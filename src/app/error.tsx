'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <h1 className="text-2xl font-bold">Une erreur est survenue / Gen yon erè ki fèt</h1>
      <p className="mt-2 text-neutral-600">Service temporairement indisponible. Réessayez dans un instant.</p>
      <button onClick={reset} className="mt-6 min-h-11 rounded-xl bg-brand px-5 font-semibold text-white">Réessayer</button>
      <p className="mt-6 break-words rounded-lg bg-neutral-100 p-3 text-left text-xs text-neutral-600">
        Détail technique : {error.message || 'inconnu'}{error.digest ? ` (réf. ${error.digest})` : ''}
      </p>
    </div>
  );
}
