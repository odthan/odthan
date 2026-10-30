# ODTHAN — portail central des services

**Infinite Vision. Global Ambition.** — Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Auth, PostgreSQL, Storage, Realtime) · Vercel · PWA.

Le nom de l'application est **ODTHAN** (en-tête, PWA « ODTHAN Admin », titres). Le logo officiel est utilisé tel quel : `public/brand/odthan-logo.png` (fichier d'origine, non modifié). Les icônes PWA sont ce même logo redimensionné sur fond blanc.

Ce projet est **indépendant** de KONSTRIVAL et d'ODTHAN Business : leurs sites ne sont ni modifiés ni intégrés. Ils sont enregistrés comme *services* en base et leurs boutons ouvrent les vrais sites (`https://konstrival.odthan.com`, `https://business.odthan.com`).

## Ce qui est implémenté
- Accueil public (recherche + catégories + cartes **lues dans Supabase**), fiche service `/services/[slug]`, contact (formulaire enregistré en base + bouton WhatsApp +50940894038), confidentialité, 404, sitemap, robots, Open Graph, JSON-LD `Service`.
- Comptes : `/register`, `/login`, `/forgot-password`, `/reset-password`, `/account`, `/account/profile`, `/account/requests`, `/account/notifications` (Supabase Auth, e-mail confirmé par lien réel, suppression de compte *demandée* puis traitée par l'équipe).
- Demandes de services (référence unique, 8 statuts, pièces jointes privées, historique), messagerie par demande (temps réel), notes internes invisibles du client.
- Administration mobile-first `/admin` : dashboard (chiffres réels), services (ajout/modif/brouillon/publier/dépublier/désactiver/réactiver/supprimer/recherche/filtre/tri/ordre, téléversement d'images vers Storage, URL officielle vérifiée avant publication), catégories, demandes, clients, messages de contact, notifications, analytique, utilisateurs & rôles (+ journal), paramètres.
- Notifications enregistrées en base par **triggers SQL**, distribuées en Realtime ; son WebAudio (activation par geste, volume, test, choix des événements, anti-doublon, jamais sur l'historique) ; Web Push (VAPID) avec permission explicite et désinscription.
- Rôles `SUPER_ADMIN, ADMIN, MANAGER, EDITOR, SUPPORT, CLIENT` en base (`user_roles` + `role_permissions`), vérifiés côté serveur **et** par RLS.
- Analytique minimale **après consentement** (aucune IP, aucun message) : visiteurs, sessions, pages vues, sources, UTM, appareils, pays, conversion.
- FR / Créole haïtien (public + compte, sélecteur fonctionnel). L'administration est en français.
- PWA : manifest « ODTHAN Admin », service worker qui **ne met en cache aucune donnée privée** (seulement `offline.html` + icônes), page hors-ligne, invite de mise à jour.

## Installation locale
```bash
npm install
cp .env.example .env.local      # puis remplir
npm run dev
```

## 1. Supabase
1. Créez un projet Supabase.
2. SQL Editor : exécutez **dans l'ordre** `supabase/migrations/001_core.sql` → `006_seed.sql` (ou `supabase db push`).
3. Authentication → URL Configuration : *Site URL* = votre domaine, et ajoutez `https://VOTRE-DOMAINE/auth/callback` aux *Redirect URLs*.
4. Authentication → Providers → Email : laissez **« Confirm email » activé**.
5. Project Settings → API : copiez l'URL, la clé `anon`/publishable et la clé `service_role` (secrète).
6. Storage : les 3 buckets (`service-media`, `category-media` publics ; `request-attachments` privé) sont créés par la migration 005.

## 2. Premier SUPER_ADMIN (procédure sécurisée)
1. Créez votre compte sur `/register` et **cliquez le lien de confirmation reçu par e-mail**.
2. SQL Editor (rôle postgres) :
   ```sql
   select public.bootstrap_super_admin('votre-email@exemple.com');
   ```
   La fonction refuse si un SUPER_ADMIN existe déjà, si l'e-mail n'est pas confirmé, et n'est exécutable ni par `anon` ni par `authenticated`. Aucun rôle ne peut être obtenu en modifiant un profil.
3. Reconnectez-vous : `/admin` est accessible. Ensuite, attribuez les autres rôles depuis *Utilisateurs & rôles*.

## 3. Variables d'environnement (Vercel → Settings → Environment Variables)
| Variable | Portée | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | publique | URL du projet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publique | clé anon/publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | **secrète, serveur** | contact public, analytique, abonnements Push |
| `NEXT_PUBLIC_SITE_URL` | publique | ex. `https://odthan.com` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | publique | Web Push |
| `VAPID_PRIVATE_KEY` | **secrète, serveur** | Web Push |
| `VAPID_SUBJECT` | serveur | `mailto:…` |
| `PUSH_WEBHOOK_SECRET` | **secrète, serveur** | authentifie le webhook Supabase → `/api/push/notify` |

`npm run gen:vapid` génère la paire VAPID. Ne jamais préfixer un secret par `NEXT_PUBLIC_`, ne jamais committer `.env*`.

## 4. Notifications Push (application fermée)
1. Renseignez les variables VAPID + `PUSH_WEBHOOK_SECRET` sur Vercel, redéployez.
2. Supabase → Database → Webhooks → *Create*: table `public.notifications`, évènement **Insert**, type HTTP Request, `POST https://VOTRE-DOMAINE/api/push/notify`, en-tête `x-webhook-secret: <PUSH_WEBHOOK_SECRET>`.
3. Sur chaque appareil : Admin → Notifications → *Activer les notifications Push* (permission explicite).

**Limites à connaître** : le son JavaScript ne joue que si l'application est ouverte et si le navigateur l'autorise (un toucher dans la page l'active ; le mode silencieux iPhone peut le couper). Application fermée, seul le Push fonctionne. Sur iPhone/iPad, le Push exige que la PWA soit **ajoutée à l'écran d'accueil** (iOS 16.4+). Le comportement varie selon navigateur, OS, économiseur de batterie et autorisations ; Chrome Android est le cas le mieux pris en charge. Les abonnements expirés (404/410) sont supprimés automatiquement.

## 5. GitHub et Vercel
```bash
git init && git add . && git commit -m "ODTHAN"
git remote add origin https://github.com/VOUS/odthan.git && git push -u origin main
```
Vercel → *Add New → Project* → importer le dépôt → renseigner les variables → *Deploy*. Domaine : Vercel → Settings → Domains, puis mettre à jour `NEXT_PUBLIC_SITE_URL` et les URLs de redirection Supabase. Publier ou modifier un service **ne demande aucun redéploiement** : les pages publiques sont rendues dynamiquement à chaque requête.

## 6. Installer l'administration sur Android
Ouvrez `https://VOTRE-DOMAINE/admin` dans Chrome → connectez-vous → menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »). Dans l'app : Notifications → *Activer les alertes sonores* puis *Activer les notifications Push*.

## 7. Tests
```bash
npm run typecheck && npm test          # 25 tests unitaires (validation, permissions, i18n, périodes)
npm run build                           # build de production
npm run test:db                         # migrations + 95 contrôles RLS sur PostgreSQL local (faux schéma auth/storage, voir tests/)
```
`test:db` exige un PostgreSQL local (`PGHOST/PGPORT/PGUSER`). Il valide les migrations et les politiques RLS, **pas** Supabase Auth réel.

### Test manuel après déploiement
1. `/register` → e-mail reçu → lien → `/login`. 2. `bootstrap_super_admin`. 3. `/admin/services/new` → publier → le service apparaît sur `/` sans redéploiement. 4. Avec un 2ᵉ compte : envoyer une demande → l'admin reçoit cloche + son + (Push) ; répondre → le client est notifié. 5. Un 2ᵉ client ne voit pas la demande du 1ᵉʳ. 6. Installer la PWA, couper le réseau : page hors-ligne, aucune modification « fantôme ». 7. Vérifier le code source de la page : aucune clé secrète.

## Google Play (Android)
Voir **`docs/ANDROID-GOOGLE-PLAY.md`** (stratégie TWA, génération de l'AAB depuis un téléphone, fiche, sécurité des données, suppression de compte) et le dossier `play-store/` (icône, image de présentation, textes).

## Sécurité — résumé
RLS activé sur toutes les tables (jamais désactivé) · privilèges de colonnes (un client ne peut ni choisir son statut, ni modifier `email`/rôles, ni insérer une notification) · `service_name` des demandes réécrit par trigger · garde-fous sur les rôles (pas d'auto-promotion, dernier SUPER_ADMIN protégé, seul un SUPER_ADMIN gère ADMIN/SUPER_ADMIN) · buckets avec taille/MIME limités, pièces jointes privées + URLs signées 5 min · `getUser()` (jeton validé) dans le middleware · en-têtes de sécurité · `noindex` sur admin/compte/auth.

## Limites connues
- Contenus des services (nom, descriptions) : une seule langue saisie par l'admin (pas de traduction par champ).
- Devis : le statut « Devis envoyé » existe ; l'envoi d'un fichier de devis n'est pas implémenté (utilisez la messagerie).
- Anti-spam du formulaire de contact et limites de l'analytique : en mémoire par instance serverless (best-effort) + champ piège. Pour plus de rigueur, ajoutez un CAPTCHA ou un rate-limit partagé.
- La vérification d'URL côté serveur bloque localhost/IP littérales mais ne protège pas contre le DNS rebinding ; elle n'est accessible qu'aux rôles `services.manage`.
- Politique de confidentialité : texte modèle à faire relire juridiquement.
