import type { Metadata } from 'next';
import { getDict } from '@/i18n';
import { getSiteSettings } from '@/lib/data';
import { ContactForm } from './ContactForm';
import { WhatsAppIcon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Contact', description: 'Contactez l’assistance ODTHAN.' };
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const { t } = await getDict();
  const s = await getSiteSettings();
  const wa = s.contact?.whatsapp_url || 'https://wa.me/50940894038';
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">{t.contact.title}</h1>
      <div className="mt-6 rounded-2xl bg-ink p-5 text-white">
        <p className="text-sm text-neutral-200">{t.contact.whatsapp}</p>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#25D366] px-5 font-semibold text-white">
          <WhatsAppIcon /> {t.contact.whatsappBtn}
        </a>
      </div>
      <dl className="mt-5 space-y-1 text-sm text-neutral-600">
        {s.contact?.support_email && <div><dt className="inline font-semibold text-ink">{t.contact.mail} : </dt><dd className="inline"><a className="text-brand" href={`mailto:${s.contact.support_email}`}>{s.contact.support_email}</a></dd></div>}
        {s.contact?.support_hours && <div><dt className="inline font-semibold text-ink">{t.contact.hours} : </dt><dd className="inline">{s.contact.support_hours}</dd></div>}
      </dl>
      <ContactForm t={t.contact} />
    </div>
  );
}
