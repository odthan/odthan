import Link from 'next/link';
import { getDict } from '@/i18n';
import { getPublicCategories, searchPublicServices } from '@/lib/data';
import { isConfigured } from '@/lib/env';
import { ServiceCard } from '@/components/ServiceCard';
import { Icon } from '@/components/Icon';
import { LogoMark } from '@/components/Logo';

export const dynamic = 'force-dynamic'; // données toujours fraîches : un service publié apparaît immédiatement

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { t } = await getDict();
  const sp = await searchParams;
  if (!isConfigured()) return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">{t.common.setupTitle}</h1><p className="mt-3 text-neutral-600">{t.common.setupText}</p></div>
  );
  const [categories, services] = await Promise.all([getPublicCategories(), searchPublicServices({ q: sp.q, category: sp.cat })]);
  const searching = Boolean(sp.q || sp.cat);
  return (
    <>
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">ODTHAN</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">{t.brand.signature}</h1>
            <p className="mt-5 max-w-xl text-base text-neutral-300">{t.hero.text}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#services" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand-dark">{t.hero.discover}</a>
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 font-semibold hover:bg-white/10">{t.hero.create}</Link>
            </div>
          </div>
          <div className="mx-auto hidden w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl md:block"><LogoMark className="h-auto w-full" /></div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12">
        <h2 className="text-2xl font-bold md:text-3xl">{t.services.title}</h2>
        <form action="/" method="get" role="search" className="mt-5 flex flex-col gap-2 sm:flex-row">
          {sp.cat && <input type="hidden" name="cat" value={sp.cat} />}
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-neutral-400" />
            <input name="q" defaultValue={sp.q ?? ''} maxLength={80} placeholder={t.search.placeholder} aria-label={t.search.button}
              className="block min-h-12 w-full rounded-xl border border-neutral-300 py-3 pl-11 pr-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
          </div>
          <button className="min-h-12 rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand-dark">{t.search.button}</button>
        </form>
        {categories.length > 0 && (
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1" role="list">
            <Link role="listitem" href={sp.q ? `/?q=${encodeURIComponent(sp.q)}#services` : '/#services'} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${!sp.cat ? 'border-ink bg-ink text-white' : 'border-neutral-300'}`}>{t.search.all}</Link>
            {categories.map((c) => (
              <Link role="listitem" key={c.id} href={`/?cat=${c.slug}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}#services`}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${sp.cat === c.slug ? 'border-ink bg-ink text-white' : 'border-neutral-300 hover:border-brand'}`}>{c.name}</Link>
            ))}
          </div>
        )}
        {searching && <p className="mt-4 text-sm text-neutral-500" aria-live="polite">{services.length} {t.search.results}</p>}
        {services.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
            <p className="font-semibold">{searching ? t.search.empty : t.services.none}</p>
            {searching && <><p className="mt-1 text-sm text-neutral-500">{t.search.emptyHint}</p><Link href="/#services" className="mt-4 inline-block font-semibold text-brand">{t.search.reset}</Link></>}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map((s) => <ServiceCard key={s.id} s={s} t={t} />)}</div>
        )}
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16">
        <h2 className="text-2xl font-bold md:text-3xl">{t.how.title}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[[t.how.s1t, t.how.s1], [t.how.s2t, t.how.s2], [t.how.s3t, t.how.s3]].map(([h, p]) => (
            <div key={h} className="rounded-2xl border border-neutral-200 p-5"><h3 className="font-bold text-brand">{h}</h3><p className="mt-2 text-sm text-neutral-600">{p}</p></div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-16 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{t.about.title}</h2>
        <p className="mt-4 text-neutral-600">{t.about.text}</p>
      </section>
    </>
  );
}
