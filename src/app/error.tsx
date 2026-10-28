'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <h1 className="text-2xl font-bold">Une erreur est survenue / Gen yon erè ki fèt</h1>
      <p className="mt-2 text-neutral-600">Service temporairement indisponible. Réessayez dans un instant.</p>
      <button onClick={reset} className="mt-6 min-h-11 rounded-xl bg-brand px-5 font-semibold text-white">Réessayer</button>
    </div>
  );
}
