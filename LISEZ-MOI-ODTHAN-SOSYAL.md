# ODTHAN SOSYAL — fichiers à AJOUTER (aucun fichier existant n'est modifié)

Chaque fichier ci-dessous est NOUVEAU. Sur GitHub : *Add file → Create new file*, tapez le chemin complet dans le champ du nom
(les « / » créent les dossiers), collez le contenu, *Commit changes*. Gardez les majuscules et les parenthèses de `(site)`.

## Étape 1 — Supabase (SQL Editor), un morceau à la fois, dans l'ordre
1. `supabase/sql-mobile/007-01-sur-03.sql`  2. `007-02-sur-03.sql`  3. `007-03-sur-03.sql`  (*Run*, attendre « Success »)
Vérification : Table Editor → `social_links` contient 9 lignes.

## Étape 2 — GitHub : 11 fichiers nouveaux
src/lib/social-icons.ts
src/lib/sosyal.ts
src/lib/sosyal-data.ts
src/components/SocialButton.tsx
src/components/SosyalSection.tsx
src/components/SocialImageUpload.tsx
src/app/api/sosyal/click/route.ts
src/app/(site)/sosyal/page.tsx
src/app/admin/sosyal/actions.ts
src/app/admin/sosyal/SocialForm.tsx
src/app/admin/sosyal/page.tsx
(+ facultatif : supabase/migrations/007_sosyal.sql comme copie dans le dépôt)

## Étape 3 — Résultat (sans rien modifier)
- Page publique : https://www.odthan.com/sosyal  →  « SWIV NOU SOU » avec les 9 plateformes.
- Gestion (SUPER_ADMIN) : https://www.odthan.com/admin/sosyal  →  « Jesyon ODTHAN SOSYAL » (ajoutez ce lien en favori).
- Dans l'application Android ODTHAN : ouvrez la même adresse (la mise à jour est automatique, pas de nouvel AAB).

---------------------------------------------------------------------------------------------
# FACULTATIF plus tard — afficher ODTHAN SOSYAL sur l'accueil, dans le menu admin et le pied de page
(Ces 3 petits ajouts MODIFIENT des fichiers existants. Ne les faites que si vous le voulez. Vérifiés : le projet compile avec.)

## A. Accueil — fichier `src/app/(site)/page.tsx`
1) Après la ligne  `import { LogoMark } from '@/components/Logo';`  ajoutez :
```
import { SosyalSection } from '@/components/SosyalSection';
import { getSocialLinks } from '@/lib/sosyal-data';
```
2) Remplacez la ligne  `const [categories, services] = await Promise.all([getPublicCategories(), searchPublicServices({ q: sp.q, category: sp.cat })]);`  par :
```
const [categories, services, social] = await Promise.all([getPublicCategories(), searchPublicServices({ q: sp.q, category: sp.cat }), getSocialLinks()]);
```
3) Juste avant la ligne  `<section id="about"`  ajoutez :
```
      <SosyalSection links={social} />

```

## B. Menu de l'administration — fichier `src/app/admin/layout.tsx`
Juste avant la ligne qui commence par  `{ href: '/admin/settings', label: 'Paramètres'`  ajoutez :
```
  { href: '/admin/sosyal', label: 'Jesyon ODTHAN SOSYAL', icon: 'share', perm: 'social.manage' },
```

## C. Pied de page — fichier `src/app/(site)/layout.tsx`
1) Après la ligne  `import { getSiteSettings } from '@/lib/data';`  ajoutez :
```
import { getSocialLinks } from '@/lib/sosyal-data';
import { SosyalIcons } from '@/components/SosyalSection';
```
2) Remplacez  `const [settings, access] = await Promise.all([getSiteSettings(), getAccess()]);`  par :
```
const [settings, access, social] = await Promise.all([getSiteSettings(), getAccess(), getSocialLinks()]);
```
3) Juste avant la ligne  `<p className="text-xs text-neutral-500">©`  ajoutez :
```
          <SosyalIcons links={social} />
```
