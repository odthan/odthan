import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = { title: 'Politique de confidentialité', description: 'Données collectées par ODTHAN, finalités, services tiers, durée de conservation et suppression du compte.' };
export const dynamic = 'force-dynamic';

const Row = ({ a, b, c }: { a: string; b: string; c: string }) => (
  <tr className="align-top"><td className="border-t py-2 pr-3 font-medium">{a}</td><td className="border-t py-2 pr-3">{b}</td><td className="border-t py-2">{c}</td></tr>
);

export default async function Privacy() {
  const s = await getSiteSettings();
  const email = s.contact?.support_email as string | undefined;
  const wa = (s.contact?.whatsapp_url as string | undefined) || 'https://wa.me/50940894038';
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-neutral-700">
      <div><h1 className="text-3xl font-extrabold text-ink">Politique de confidentialité</h1><p className="mt-1 text-sm text-neutral-500">Application et site ODTHAN — dernière mise à jour : octobre 2026</p></div>

      <section><h2 className="text-lg font-bold text-ink">1. Qui sommes-nous</h2>
        <p className="mt-2">ODTHAN (« nous ») édite le portail et l’application mobile ODTHAN, qui permettent de découvrir des services (dont KONSTRIVAL et ODTHAN Business), d’envoyer des demandes de services et d’échanger avec notre équipe. Contact pour toute question sur vos données : {email ? <a className="text-brand underline" href={`mailto:${email}`}>{email}</a> : null}{email ? ' ou ' : ''}<a className="text-brand underline" href={wa}>WhatsApp +509 4089 4038</a> ou la <Link className="text-brand underline" href="/contact">page Contact</Link>.</p></section>

      <section><h2 className="text-lg font-bold text-ink">2. Données collectées et finalités</h2>
        <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="text-neutral-500"><th className="pb-2 pr-3">Données</th><th className="pb-2 pr-3">Quand</th><th className="pb-2">Pourquoi</th></tr></thead><tbody>
          <Row a="Compte : nom, e-mail, mot de passe (stocké chiffré par le service d’authentification), pays, langue" b="Création du compte" c="Vous identifier, sécuriser l’accès, vous répondre" />
          <Row a="Profil facultatif : téléphone, ville" b="Vous les renseignez" c="Vous contacter au sujet d’une demande" />
          <Row a="Demandes de services : nom du projet, description, pays/ville, budget et délai indicatifs, coordonnées de contact" b="Envoi d’une demande" c="Traiter votre demande et vous envoyer un devis" />
          <Row a="Pièces jointes (PDF, images)" b="Si vous en ajoutez" c="Étudier votre demande ; accès privé, réservé à vous et à l’équipe autorisée" />
          <Row a="Messages échangés sur une demande" b="Messagerie" c="Assurer le suivi de la demande" />
          <Row a="Notifications (contenu, état lu/non lu) et préférences (son, volume)" b="Utilisation" c="Vous informer des réponses et changements de statut" />
          <Row a="Abonnement aux notifications Push (adresse technique de l’appareil/navigateur)" b="Si vous activez le Push" c="Envoyer les alertes lorsque l’application est fermée" />
          <Row a="Messages du formulaire Contact : nom, e-mail, téléphone, message" b="Envoi du formulaire" c="Répondre à votre message" />
          <Row a="Mesure d’audience : pages vues, service consulté, appareil et navigateur approximatifs, pays (déduit par l’hébergeur), source de visite, identifiants aléatoires anonymes de visite et de session" b="Uniquement si vous acceptez la mesure" c="Comprendre l’usage du service. Aucune adresse IP, aucun identifiant de compte, aucun contenu de message n’est enregistré" />
        </tbody></table></div>
        <p className="mt-3">Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité.</p></section>

      <section><h2 className="text-lg font-bold text-ink">3. Services tiers (sous-traitants)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Supabase</strong> : base de données, authentification, stockage des fichiers et temps réel.</li>
          <li><strong>Vercel</strong> : hébergement du site et de l’application web.</li>
          <li><strong>Service de notification du navigateur</strong> (par exemple celui de Google pour Chrome) : transmet les notifications Push si vous les activez.</li>
          <li><strong>WhatsApp (Meta)</strong> : seulement si vous touchez le bouton WhatsApp ; la conversation relève alors des conditions de WhatsApp.</li>
          <li>Les sites des services (KONSTRIVAL, ODTHAN Business) sont des sites distincts avec leurs propres règles.</li>
        </ul></section>

      <section><h2 className="text-lg font-bold text-ink">4. Stockage sur votre appareil</h2>
        <p className="mt-2">Nous utilisons un cookie de session (connexion), un cookie de langue et, uniquement si vous acceptez la mesure d’audience, des identifiants aléatoires dans le stockage local. L’application peut mettre en cache sa page « hors connexion » ; elle ne met pas en cache vos données privées.</p></section>

      <section><h2 className="text-lg font-bold text-ink">5. Sécurité</h2>
        <p className="mt-2">Les échanges sont chiffrés (HTTPS). L’accès aux données est contrôlé côté serveur et par des règles de sécurité de la base : un client ne peut lire que ses propres demandes, messages et notifications. Aucun système n’est infaillible ; en cas d’incident, nous informerons les personnes concernées dans les délais applicables.</p></section>

      <section><h2 className="text-lg font-bold text-ink">6. Conservation et suppression</h2>
        <p className="mt-2">Vos données sont conservées tant que votre compte existe. Vous pouvez modifier votre profil à tout moment et <Link className="text-brand underline" href="/account-deletion">demander la suppression de votre compte et de vos données</Link> (traitement sous 30 jours maximum). Les mesures d’audience anonymes ne contiennent aucun identifiant de compte et ne peuvent pas être rattachées à vous.</p></section>

      <section><h2 className="text-lg font-bold text-ink">7. Vos droits</h2>
        <p className="mt-2">Selon votre pays, vous pouvez demander l’accès, la rectification, l’effacement ou la limitation de vos données, ou vous opposer à leur traitement. Écrivez-nous via les contacts ci-dessus depuis l’adresse e-mail de votre compte.</p></section>

      <section><h2 className="text-lg font-bold text-ink">8. Mineurs</h2>
        <p className="mt-2">Le service s’adresse à des personnes et entreprises souhaitant commander des prestations ; il n’est pas destiné aux enfants.</p></section>

      <section><h2 className="text-lg font-bold text-ink">9. Modifications</h2>
        <p className="mt-2">Nous pouvons mettre à jour cette politique ; la date en haut de page indique la dernière version.</p></section>
    </div>
  );
}
