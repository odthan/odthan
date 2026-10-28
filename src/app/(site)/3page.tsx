import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Politique de confidentialité' };
export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 text-neutral-700">
      <h1 className="text-3xl font-extrabold text-ink">Politique de confidentialité</h1>
      <p><strong>Données de compte.</strong> Nom, e-mail, pays et coordonnées que vous fournissez pour créer un compte et envoyer des demandes. Elles ne sont visibles que de vous et du personnel autorisé d’ODTHAN.</p>
      <p><strong>Demandes et messages.</strong> Le contenu de vos demandes, messages et pièces jointes est protégé par des règles d’accès : un client ne peut jamais lire les données d’un autre client.</p>
      <p><strong>Mesure d’audience.</strong> Uniquement si vous l’acceptez : pages vues, appareil et navigateur approximatifs, pays (via l’hébergeur), source de visite et paramètres UTM. Nous n’enregistrons ni adresse IP, ni mot de passe, ni contenu de message. Vous pouvez refuser : le site fonctionne de la même façon.</p>
      <p><strong>Notifications.</strong> Les notifications Push ne sont activées qu’après votre autorisation explicite et peuvent être désactivées à tout moment depuis votre espace.</p>
      <p><strong>Vos droits.</strong> Vous pouvez modifier votre profil et demander la suppression de votre compte depuis « Mon compte ». Pour toute question, utilisez la page Contact.</p>
      <p className="text-sm text-neutral-500">Ce texte est un modèle de départ : faites-le relire par un conseiller juridique selon les pays desservis avant la mise en production.</p>
    </div>
  );
}
