import Link from 'next/link';
import { getDict } from '@/i18n';
import { getSiteSettings } from '@/lib/data';
import { getAccess, isStaffRole } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { setLang, logout } from '@/app/actions';
import { MobileNav } from '@/components/MobileNav';
import { WhatsAppIcon } from '@/components/Icon';
import { ConsentBanner, PageTracker } from '@/components/Analytics';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = await getDict();
  const [settings, access] = await Promise.all([getSiteSettings(), getAccess()]);
  const wa = settings.contact?.whatsapp_url || 'https://wa.me/50940894038';
  const links = [
    { href: '/', label: t.nav.home }, { href: '/#services', label: t.nav.services }, { href: '/#how', label: t.nav.how },
    { href: '/#about', label: t.nav.about }, { href: '/contact', label: t.nav.contact },
  ];
  const langForm = (
    <form action={setLang} className="flex overflow-hidden rounded-lg border border-neutral-300 text-xs font-semibold" aria-label="Langue / Lang">
      <button name="lang" value="fr" aria-pressed={lang === 'fr'} className={`px-2.5 py-1.5 ${lang === 'fr' ? 'bg-ink text-white' : 'bg-white'}`}>FR</button>
      <button name="lang" value="ht" aria-pressed={lang === 'ht'} className={`px-2.5 py-1.5 ${lang === 'ht' ? 'bg-ink text-white' : 'bg-white'}`}>HT</button>
    </form>
  );
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex" aria-label="Principal">
            {links.map((l) => <Link key={l.href} href={l.href} className="text-neutral-700 hover:text-brand">{l.label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {langForm}
            {access.user ? (
              <>
                {isStaffRole(access.roles) && <Link href="/admin" className="text-sm font-semibold text-brand">{t.nav.admin}</Link>}
                <Link href="/account" className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold">{t.nav.account}</Link>
                <form action={logout}><button className="text-sm text-neutral-600 hover:text-brand">{t.nav.logout}</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-ink hover:text-brand">{t.nav.login}</Link>
                <Link href="/register" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">{t.nav.register}</Link>
              </>
            )}
          </div>
          <MobileNav label={t.nav.menu} links={links} langForm={langForm}
            auth={access.user ? { account: t.nav.account, logout: t.nav.logout, admin: isStaffRole(access.roles) ? t.nav.admin : null }
              : { login: t.nav.login, register: t.nav.register }}
            logoutAction={logout} />
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 bg-ink text-neutral-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
          <div><Logo dark sub={t.brand.signature} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/contact" className="hover:text-white">{t.nav.contact}</Link>
            <Link href="/privacy" className="hover:text-white">{t.footer.privacy}</Link>
            <Link href="/login" className="hover:text-white">{t.nav.login}</Link>
          </div>
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} ODTHAN. {t.footer.rights}</p>
        </div>
      </footer>
      <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={t.contact.whatsappBtn}
        className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105">
        <WhatsAppIcon className="h-7 w-7" />
      </a>
      <PageTracker />
      <ConsentBanner text={t.consent.text} accept={t.consent.accept} decline={t.consent.decline} privacy={t.consent.privacy} />
    </>
  );
}
