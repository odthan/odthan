import Link from 'next/link';
import Image from 'next/image';
import type { Service } from '@/lib/data';
import { formatPrice, publicUrl } from '@/lib/data';
import type { Dict } from '@/i18n/fr';

export function ServiceCard({ s, t }: { s: Service; t: Dict }) {
  const logo = publicUrl('service-media', s.logo_path);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink text-xl font-bold text-white">
          {logo ? <Image src={logo} alt="" width={56} height={56} className="h-full w-full object-contain bg-white" /> : s.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{s.name}</h3>
          {s.service_categories?.name && <span className="mt-1 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">{s.service_categories.name}</span>}
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm text-neutral-600">{s.short_description}</p>
      <dl className="mt-3 space-y-1 text-xs text-neutral-500">
        {s.countries.length > 0 && <div><dt className="inline font-medium text-neutral-700">{t.services.countries} : </dt><dd className="inline">{s.countries.join(', ')}</dd></div>}
        {s.pricing_type !== 'quote' && <div className="font-medium text-neutral-700">{formatPrice(s, t.services)}</div>}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/services/${s.slug}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">{t.services.discover}</Link>
        {s.allow_requests && <Link href={`/account/requests/new?service=${s.slug}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand-soft">{t.services.request}</Link>}
      </div>
    </article>
  );
}
