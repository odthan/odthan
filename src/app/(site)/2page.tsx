import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = { title: 'Suppression du compte', description: 'Comment demander la suppression de votre compte ODTHAN et des données associées.' };
export const dynamic = 'force-dynamic';

export default async function AccountDeletion() {
  const s = await getSiteSettings();
  const email = s.contact?.support_email as string | undefined;
  const wa = (s.contact?.whatsapp_url as string | undefined) || 'https://wa.me/50940894038';
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-neutral-700">
      <h1 className="text-3xl font-extrabold text-ink">Supprimer mon compte ODTHAN</h1>
      <section><h2 className="text-lg font-bold text-ink">Depuis l’application ou le site</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5"><li>Connectez-vous.</li><li>Ouvrez <strong>Mon compte → Profil</strong>.</li><li>Touchez <strong>« Demander la suppression de mon compte »</strong> et confirmez.</li></ol>
        <p className="mt-2">Notre équipe vérifie la demande puis supprime le compte, <strong>au plus tard sous 30 jours</strong>.</p></section>
      <section><h2 className="text-lg font-bold text-ink">Si vous ne pouvez plus vous connecter</h2>
        <p className="mt-2">Écrivez-nous depuis l’adresse e-mail du compte : {email ? <a className="text-brand underline" href={`mailto:${email}`}>{email}</a> : null}{email ? ', ' : ''}<a className="text-brand underline" href={wa}>WhatsApp +509 4089 4038</a> ou la <Link className="text-brand underline" href="/contact">page Contact</Link>. Nous pourrons vous demander de confirmer votre identité.</p></section>
      <section><h2 className="text-lg font-bold text-ink">Ce qui est supprimé</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5"><li>Votre compte et votre profil (nom, e-mail, pays, téléphone, ville).</li><li>Vos demandes de services, leur historique, vos messages et vos pièces jointes.</li><li>Vos notifications, préférences et abonnements Push.</li></ul>
        <p className="mt-2">Restent uniquement les mesures d’audience anonymes (sans identifiant de compte ni adresse IP) et les informations que la loi nous oblige à conserver, le cas échéant.</p></section>
      <p className="text-sm text-neutral-500">Voir aussi la <Link className="text-brand underline" href="/privacy">politique de confidentialité</Link>.</p>
    </div>
  );
}
