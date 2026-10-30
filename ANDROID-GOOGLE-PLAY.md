# ODTHAN sur Google Play — guide complet (depuis un téléphone)

> **Statut réel** : projet analysé ✅ · version Android *préparée côté site* ✅ · **fichier AAB : NON généré** (l'environnement de travail n'a pas accès au SDK Android/Gradle) · rien téléversé · rien soumis · rien publié.
> Je n'ai pas pu consulter la documentation Google en ligne (accès réseau bloqué) : les règles Google ci-dessous viennent de mes connaissances et sont marquées **« à vérifier »** quand elles peuvent avoir changé.

## 1. Analyse du projet
| Point | Constat |
|---|---|
| Technologie | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind, Supabase (Auth, Postgres, Storage, Realtime), hébergé sur Vercel |
| Rendu serveur | **Oui** : 7 fichiers de Server Actions, 5 routes d'API, middleware de session. Un export statique (Capacitor classique) est **impossible** sans réécrire l'application |
| PWA | Oui : manifeste, service worker (cache limité à la page hors-ligne + icônes), icônes 192/512/maskable, Web Push (VAPID) |
| Authentification | Supabase Auth, cookies de session validés côté serveur, RLS sur toutes les tables (96 contrôles réussis en test local) |
| Notifications | Temps réel + son quand l'app est ouverte ; Web Push quand elle est fermée (clés VAPID) |
| Points bloquants trouvés et **corrigés** | manifeste orienté administration (`start_url: /admin`) → remplacé par une app client ; pas de page de suppression de compte → créée ; politique de confidentialité trop générale → réécrite ; suppression de compte seulement « demandée » → l'admin peut maintenant la **réaliser** (compte + données + fichiers) |

## 2. Stratégie retenue : **TWA (Trusted Web Activity) — l'app Android affiche le vrai site en plein écran**
| Option | Verdict |
|---|---|
| PWA seule | Pas de fichier AAB → pas de Google Play. Reste utilisable via « Installer l'application » |
| **TWA** (retenue) | Garde 100 % des fonctions (serveur, sessions, Supabase, Web Push existant). Les mises à jour du site sont **instantanées** sans nouvelle version Play. Aucune clé secrète dans l'app. Pas de Firebase à configurer |
| Capacitor | Exige un export statique ou une WebView vers le site (même résultat qu'une TWA, en plus lourd) ; le Push natif demanderait Firebase + réécriture de l'envoi. Non justifié ici |
| Android natif | Réécriture complète. Non |

Conséquences : l'app s'appuie sur **Chrome** (présent sur la quasi-totalité des Android) ; la barre d'adresse disparaît seulement quand le lien `assetlinks.json` est valide (§5-E). Les liens externes (KONSTRIVAL, WhatsApp) s'ouvrent dans un onglet Chrome ou l'app WhatsApp. Le bouton Retour Android est géré par Chrome.

## 3. Ce qui a été modifié dans le projet
- `public/manifest.webmanifest` : app client « ODTHAN », `start_url /`, `id /`, catégories, raccourcis (Services, Mes demandes, Contact).
- `src/app/.well-known/assetlinks.json/route.ts` + `src/lib/assetlinks.ts` : génère le fichier de vérification Android depuis les variables `ANDROID_PACKAGE_NAME` et `ANDROID_SHA256_CERT_FINGERPRINTS` (vide tant qu'aucune empreinte n'est configurée — jamais de fausse valeur).
- `src/middleware.ts` : `/.well-known` exclu du traitement de session.
- `src/app/(site)/privacy/page.tsx` : politique complète (données réelles, tiers, durée, droits). `src/app/(site)/account-deletion/page.tsx` : page publique de suppression de compte. Liens dans le pied de page et le sitemap.
- `src/app/admin/actions.ts` + `src/app/admin/clients/page.tsx` : bouton **« Supprimer le compte et les données »** (réservé à `users.manage`, seulement si le client l'a demandé, refuse les comptes administrateurs, supprime d'abord les fichiers privés puis le compte ; la base propage la suppression).
- `src/app/layout.tsx` (titre Apple), `.env.example` (variables Android), `tests/` (+5 tests assetlinks, +1 test de suppression en cascade).
- `play-store/` : `icon-512.png`, `feature-graphic-1024x500.png` (logo officiel non modifié), `fiche-play-store.md` (textes prêts à coller).

**Identifiant Android : `com.odthan.app`** (j'ai retenu un identifiant sans « infglo » puisque le nom officiel est ODTHAN). Nom affiché : **ODTHAN**. Version **1.0.0**, code de version **1**. ⚠️ L'identifiant est définitif dès le premier envoi sur Play : il ne peut plus être changé sans publier une nouvelle application. Si vous préférez `com.odthan.infglo`, dites-le **avant** l'étape B.

## 4. Qui fait quoi
| Tâche | Qui |
|---|---|
| Modifs du site, textes, visuels, déclarations préremplies | ✅ fait (moi) |
| Envoyer les fichiers sur GitHub, variables Vercel | vous, depuis le téléphone |
| Générer l'AAB | vous, **depuis le téléphone avec PWABuilder** (§5-B) ; plan B : ordinateur emprunté 20 min ou GitHub Codespaces dans le navigateur |
| Compte développeur Play, vérification d'identité, paiement | vous seul (je ne demande jamais vos mots de passe) |
| Captures d'écran, compte de démonstration pour les examinateurs | vous |
| Soumission et **publication** | vous, sur confirmation explicite |

## 5. Procédure pas à pas

### A. Mettre le site à jour (téléphone)
1. Sur GitHub, ajoutez/remplacez les fichiers listés au §3 (ou envoyez tout le dossier du zip). Gardez les majuscules des noms.
2. Vercel → Settings → Environment Variables : ajoutez `ANDROID_PACKAGE_NAME` = `com.odthan.app` (Config). `ANDROID_SHA256_CERT_FINGERPRINTS` viendra à l'étape E.
3. **Domaine principal** : ouvrez `https://odthan.com` et `https://www.odthan.com`. Celui qui reste affiché dans la barre d'adresse est le principal. Il doit être le même dans `NEXT_PUBLIC_SITE_URL`, Supabase (*Authentication → URL Configuration*) et PWABuilder. Le fichier `/.well-known/assetlinks.json` doit répondre **sans redirection** sur ce domaine.
4. Vérifiez après déploiement : `https://VOTRE-DOMAINE/privacy`, `/account-deletion`, `/manifest.webmanifest` s'ouvrent (200). `/.well-known/assetlinks.json` affichera `[]` jusqu'à l'étape E : c'est normal.

### B. Générer l'AAB avec PWABuilder (https://www.pwabuilder.com)
1. Chrome sur le téléphone, activez **Site pour ordinateur** (menu ⋮). Entrez votre domaine principal → *Start*.
2. Le rapport doit montrer manifeste et service worker valides. Les captures d'écran manquantes sont une recommandation, pas un blocage.
3. **Package for stores → Android**. Réglages : *Package ID* `com.odthan.app` · *App name* `ODTHAN` · *Launcher name* `ODTHAN` · *Version* `1.0.0` · *Version code* `1` · *Host* votre domaine principal · *Start URL* `/` · *Display* standalone · *Status/Navigation bar* `#0A0A0A` · *Notification delegation* **ON** · *Location delegation* OFF · *Play Billing* OFF · *Signing key* **Create new**.
4. Téléchargez le zip. Il contient l'**`.aab`**, la **clé de signature (.keystore)** et ses mots de passe. **Gardez-les dans un endroit privé, avec une deuxième copie (jamais sur GitHub).** Perdre la clé complique les mises à jour (Play App Signing permet de la réinitialiser, mais gardez-la).
5. PWABuilder choisit le niveau d'API cible courant. Si Play Console refuse l'AAB (« API cible trop basse »), régénérez-le avec PWABuilder : c'est la méthode prévue pour les mises à jour techniques.

### C. Compte développeur Google Play (https://play.google.com/console)
- Paiement unique (environ 25 USD) ; connexion avec votre compte Google ; **vérification d'identité** (pièce, adresse, téléphone, e-mail ; un appareil Android peut être demandé via l'app Play Console) — **à vérifier**.
- **Compte personnel vs organisation** : *à vérifier dans Play Console*. À ma connaissance, les comptes **personnels** créés après novembre 2023 doivent mener un **test fermé** avec au moins **12 testeurs pendant 14 jours consécutifs** avant de pouvoir demander l'accès à la production ; les comptes **organisation** (numéro D-U-N-S requis) en sont dispensés. Pensez à recruter vos testeurs (e-mails Google) dès le début.

### D. Créer l'application et remplir la fiche
1. *Créer une application* : nom `ODTHAN`, langue français, **Application**, **Gratuite**.
2. Fiche principale : copiez les textes de `play-store/fiche-play-store.md`, téléversez `icon-512.png`, `feature-graphic-1024x500.png` et 2 à 8 vraies captures.
3. **Politique de confidentialité** : `https://VOTRE-DOMAINE/privacy`.
4. **Accès à l'application** : connexion requise → créez un **compte client de démonstration** (e-mail que vous contrôlez, confirmé) et saisissez ses identifiants dans *Instructions d'accès*. Ne donnez jamais un compte administrateur.
5. **Publicités** : non. **Public cible** : 18 ans et plus. **Application gouvernementale / financière / santé / actualités** : non.
6. **Classification du contenu** (questionnaire) : répondez honnêtement : pas de violence, contenu sexuel, jeux d'argent ni drogue ; la messagerie est seulement entre le client et l'équipe ODTHAN (aucun contenu public entre utilisateurs). La note finale est calculée par Google.
7. **Suppression de compte** : application avec création de compte → indiquez le chemin dans l'app (*Mon compte → Profil → Demander la suppression*) et l'URL `https://VOTRE-DOMAINE/account-deletion`. ⚠️ Vous vous engagez à traiter ces demandes sous 30 jours (bouton dans *Admin → Clients*).
8. **Sécurité des données** — réponses à saisir :
| Catégorie Google | Collectée | Facultative | Finalité |
|---|---|---|---|
| Informations personnelles : nom, adresse e-mail | Oui | Non | Gestion du compte, fonctionnement de l'app |
| Informations personnelles : numéro de téléphone, adresse (pays, ville) | Oui | Oui | Contact, traitement des demandes |
| Messages : autres messages dans l'application | Oui | Non | Messagerie, formulaire de contact |
| Photos et fichiers/documents (pièces jointes) | Oui | Oui | Étude des demandes |
| Contenu généré par l'utilisateur (description de projet) | Oui | Non | Traitement des demandes |
| Infos financières : budget indicatif saisi (prudence : à déclarer comme facultatif) | Oui | Oui | Traitement des demandes |
| Activité dans l'app : pages vues, services consultés | Oui (si consentement) | Oui | Statistiques |
| Position approximative (pays déduit par l'hébergeur) | Oui (si consentement) | Oui | Statistiques |
| Identifiants d'appareil ou autres : identifiants aléatoires de visite, abonnement Push | Oui | Oui | Statistiques, notifications |
- **Partage avec des tiers** : Supabase et Vercel agissent comme sous-traitants (service providers) ; selon la définition Google, cela n'est pas un « partage » — relisez la définition dans le formulaire pour confirmer.
- **Chiffrement en transit** : oui (HTTPS). **Suppression demandée possible** : oui + URL. Ne déclarez **pas** « aucune donnée collectée ».

### E. Premier envoi (test interne) puis liaison avec le site
1. *Test et publication → Tests internes → Créer une version* → téléversez l'`.aab` → enregistrez, ajoutez vos e-mails de testeurs → *Déployer*. Corrigez les erreurs de validation éventuelles (elles sont explicites).
2. Acceptez **Play App Signing** (recommandé).
3. *Configuration → Intégrité de l'application → Signature d'application* : copiez l'empreinte **SHA-256** du certificat de signature (format `AA:BB:…`). Ajoutez aussi celle de la clé PWABuilder (fichier `assetlinks.json` du zip) si vous testez cet AAB directement.
4. Vercel : `ANDROID_SHA256_CERT_FINGERPRINTS` = les empreintes séparées par des virgules → **Redeploy**. Vérifiez que `https://VOTRE-DOMAINE/.well-known/assetlinks.json` affiche votre package et vos empreintes.
5. Désinstallez puis réinstallez l'app depuis le lien de test : la **barre d'adresse a disparu**. Sinon, l'empreinte ou le domaine ne correspond pas.

### F. Tests et publication
| Piste | Testeurs | Examen Google | Usage |
|---|---|---|---|
| Interne | jusqu'à 100 (vos e-mails) | minimal, quasi immédiat | vérifier que tout fonctionne |
| Fermé | invités (listes d'e-mails) | oui | **obligatoire pour les comptes personnels** (voir §C) |
| Ouvert | n'importe qui via lien/Play | oui | bêta publique |
| Production | tout le monde | oui | publication |
Quand les conditions sont remplies : *Production → Créer une version* (même AAB ou plus récent, code de version supérieur) → *Envoyer pour examen*. **Je ne publierai rien sans votre confirmation explicite.**

## 6. Notifications sur Android
| Situation | Comportement attendu |
|---|---|
| App ouverte | Cloche, bandeau et **son** (après un premier toucher dans l'app) |
| Arrière-plan / fermée | **Web Push via Chrome** (délégation de notifications de la TWA, permission Android 13+ demandée). Dépend de Chrome, des services Google, de l'économiseur de batterie et des autorisations du téléphone |
| Prérequis | Variables VAPID + `PUSH_WEBHOOK_SECRET` sur Vercel et webhook/trigger Supabase (voir README) |
Ce ne sont pas des notifications natives Firebase : pas de clé Firebase ni de fichier `google-services.json` à publier. Le Push doit être **testé sur votre appareil** : je n'ai pas pu le tester.

## 7. Sécurité (vérifié / à vérifier)
✅ HTTPS partout · sessions validées côté serveur (`getUser`) · RLS actif sur toutes les tables (96 tests) · rôles en base · aucune clé secrète dans le code client ni dans le zip (`.env*` exclus) · routes `/admin` protégées · déconnexion serveur · cache hors-ligne sans données privées · suppression de compte réelle.
⚠️ À vérifier chez vous : `SUPABASE_SERVICE_ROLE_KEY` = clé `sb_secret_…` (l'ancienne clé `service_role` a été montrée dans une capture : désactivez les clés « legacy » dans Supabase quand le site fonctionne) · le texte de confidentialité fait référence à « ODTHAN » : ajoutez votre dénomination légale si vous en avez une · un conseiller juridique peut relire les textes.

## 8. Tests réalisés / non réalisés
Réalisés : build de production ✅ · 30 tests unitaires ✅ · 96 contrôles RLS/migrations (PostgreSQL local) ✅ · pages `/privacy`, `/account-deletion`, `/manifest.webmanifest`, `/.well-known/assetlinks.json` répondent 200 et le manifeste est valide ✅ · absence de fuite de secrets dans le code public ✅.
**Non réalisés** (nécessitent un appareil/Play) : build Android, installation de l'AAB, connexion/inscription réelles sur Supabase, liens de confirmation e-mail ouverts dans l'app, Push réel, téléversement d'images sur le vrai Storage, vérification `assetlinks`, comportement sur plusieurs écrans.

## 9. Check-list finale
- [ ] Variables Vercel `ANDROID_*` · [ ] domaine principal confirmé · [ ] AAB généré (PWABuilder) et clé sauvegardée · [ ] compte Play créé et vérifié · [ ] fiche + visuels + 2 captures réelles · [ ] confidentialité + suppression de compte en ligne · [ ] Sécurité des données remplie · [ ] compte de démonstration · [ ] test interne OK · [ ] empreinte Play ajoutée sur Vercel · [ ] test fermé (si compte personnel) · [ ] soumission · [ ] publication (sur votre confirmation).
