import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE_URL } from '@/lib/env';
import { getLang } from '@/i18n';
import { getSiteSettings } from '@/lib/data';
import { PwaRegister } from '@/components/PwaRegister';

const base: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'ODTHAN — Infinite Vision. Global Ambition.', template: '%s | ODTHAN' },
  description: 'Découvrez les services professionnels ODTHAN : construction, services numériques et plus.',
  applicationName: 'ODTHAN',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/favicon-48.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'ODTHAN Admin', statusBarStyle: 'black-translucent' },
  openGraph: { siteName: 'ODTHAN', type: 'website', images: ['/og-default.png'], locale: 'fr_FR' },
  twitter: { card: 'summary_large_image', images: ['/og-default.png'] },
};
export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getSiteSettings()).seo;
  if (!seo) return base;
  return { ...base, title: { default: seo.title || (base.title as any).default, template: '%s | ODTHAN' }, description: seo.description || base.description };
}
export const viewport: Viewport = { themeColor: '#0A0A0A', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang === 'ht' ? 'ht' : 'fr'}>
      <body className="min-h-screen font-sans">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
