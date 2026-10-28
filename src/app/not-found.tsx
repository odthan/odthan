import Link from 'next/link';
import { getDict } from '@/i18n';
export default async function NotFound() {
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold">{t.common.notFound}</h1>
      <p className="mt-2 text-neutral-600">{t.common.notFoundText}</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 font-semibold text-white">{t.common.home}</Link>
    </div>
  );
}
