import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getDict } from '@/i18n';
import { formatPrice, getPublicService, publicUrl } from '@/lib/data';
import { ServiceViewTracker } from '@/components/Analytics';
import { Icon } from '@/components/Icon';
import { SITE_URL } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getPublicService((await params).slug);
  if (!s) return { title: 'Service introuvable', robots: { index: false } };
  const img = publicUrl('service-media', s.cover_path) ?? publicUrl('service-media', s.logo_path) ?? '/og-default.png';
  return { title: s.name, description: s.short_description, alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: s.name, description: s.short_description, images: [img], url: `${SITE_URL}/services/${s.slug}` } };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getDict();
  const s = await getPublicService((await params).slug);
  if (!s) notFound();
  const cover = publicUrl('service-media', s.cover_path);
  const logo = publicUrl('service-media', s.logo_path);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Service', name: s.name, description: s.short_description,
    url: `${SITE_URL}/services/${s.slug}`, ...(s.countries.length ? { areaServed: s.countries } : {}), provider: { '@type': 'Organization', name: 'ODTHAN', url: SITE_URL } };
  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ServiceViewTracker serviceId={s.id} categoryId={s.category_id} />
      <Link href="/#services" className="text-sm text-neutral-500 hover:text-brand">← {t.services.title}</Link>
      {cover && <Image src={cover} alt="" width={1200} height={500} className="mt-4 h-48 w-full rounded-2xl object-cover md:h-72" priority />}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink text-2xl font-bold text-white">
          {logo ? <Image src={logo} alt="" width={64} height={64} className="h-full w-full bg-white object-contain" /> : s.name.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">{s.name}</h1>
          {s.service_categories?.name && <span className="mt-1 inline-block rounded-full bg-brand-soft px-3 py-0.5 text-xs font-medium text-brand-dark">{s.service_categories.name}</span>}
        </div>
      </div>
      <p className="mt-5 text-lg text-neutral-700">{s.short_description}</p>
      {s.description && <p className="mt-4 whitespace-pre-line text-neutral-600">{s.description}</p>}
      <dl className="mt-6 grid gap-3 rounded-2xl bg-mist p-5 text-sm sm:grid-cols-2">
        {s.countries.length > 0 && <div><dt className="font-semibold">{t.services.countries}</dt><dd className="text-neutral-600">{s.countries.join(', ')}</dd></div>}
        {s.languages.length > 0 && <div><dt className="font-semibold">{t.services.languages}</dt><dd className="text-neutral-600">{s.languages.join(', ')}</dd></div>}
        <div><dt className="font-semibold">{t.services.fixed}</dt><dd className="text-neutral-600">{formatPrice(s, t.services)}</dd></div>
        {s.contact_phone && <div><dt className="font-semibold">{t.contact.phone}</dt><dd><a href={`tel:${s.contact_phone}`} className="text-brand">{s.contact_phone}</a></dd></div>}
      </dl>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {s.official_url && (
          <a href={s.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 font-semibold text-white hover:bg-ink-3">
            {t.services.discover} {s.name} <Icon name="ext" className="h-4 w-4" />
          </a>
        )}
        {s.allow_requests ? (
          <Link href={`/account/requests/new?service=${s.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand-dark">{t.services.request}</Link>
        ) : null}
        {s.contact_button_url && (
          <a href={s.contact_button_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 px-6 font-semibold">{s.contact_button_label || t.nav.contact}</a>
        )}
      </div>
    </article>
  );
}
