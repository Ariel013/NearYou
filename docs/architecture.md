# Architecture — GéoService (NearYou)

> *Comment c'est fait, et pourquoi comme ça.* À lire avant toute décision
> structurante. Les choix arbitrés entre plusieurs options sont dans
> `docs/decisions/` ; ce document décrit l'état, il renvoie aux ADR pour le
> pourquoi.
>
> Ce document reprend la spécification produit qui vivait dans `CLAUDE.md`
> jusqu'au 2026-10-22, **corrigée de ce qui avait divergé du code** (Next 16 et
> non 15, bot WhatsApp et non Africa's Talking pour la revendication, client
> Supabase direct et non Prisma).

## 1. Vision

**GéoService Proximité** connecte des particuliers et entreprises locales avec
des prestataires de services de proximité (menuisiers, plombiers, électriciens,
agents de ménage, coursiers…) par géolocalisation, en Afrique de l'Ouest
(Bénin, Côte d'Ivoire).

- N'importe qui peut **créer une fiche** pour un prestataire (modèle
  communautaire).
- Le prestataire **revendique sa fiche** en prouvant qu'il détient le numéro
  de la fiche (aujourd'hui : code envoyé au bot WhatsApp).
- Chercher, voir une fiche, appeler, écrire sur WhatsApp, demander
  l'itinéraire : **sans compte**.
- À venir : **messagerie** dans l'appli, qui demandera un compte léger
  (numéro vérifié) — voir ADR 0001.

**Utilisateurs cibles** : chercheurs de service ; prestataires souvent peu
digitalisés ; contributeurs qui connaissent un bon prestataire.

**Identité** : nom affiché *GéoService*, tagline « Le bon artisan, à deux pas
de chez vous ». Ton chaleureux, de proximité, africain moderne. **Mobile
first** (320 → 390 → 768 → 1280 px).

## 2. Stack réelle

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router), React 19 — lire `node_modules/next/dist/docs/` avant de coder (voir `AGENTS.md`) |
| Langage | TypeScript strict |
| Styles / UI | Tailwind CSS v4 + custom properties, composants shadcn/ui |
| Cartes | MapLibre GL JS sur tuiles vectorielles OpenFreeMap, restylées à la charte, vue 3D — ADR 0004 |
| Adresses | Suggestions et quartier d'un point par Photon (OpenStreetMap), appelé par `/api/geocode` — ADR 0005 |
| Base | Supabase (PostgreSQL 17 + PostGIS), **client Supabase direct** (`@supabase/ssr`), pas d'ORM |
| Formulaires | React Hook Form + Zod (validation client **et** serveur) |
| État client | Zustand |
| Icônes / animation | Lucide React, Framer Motion |
| Revendication de fiche | Bot WhatsApp (Baileys) dans `bot/`, hébergé sur Railway |
| Code OTP des avis | `src/lib/africa-talking.ts` (SMS) — **sans clé, le code est seulement écrit dans les logs** (à vérifier en prod, voir `A-FAIRE.md`) |
| Hébergement | Vercel (app), Supabase plan gratuit (base), Railway (bot) |

## 3. Organisation du code

- `src/app/` — pages (accueil, `providers/`, `providers/[id]` en SSR,
  `providers/new`, `claim`, `dashboard`, `admin/`) et routes API (`api/`).
- `src/components/` — par domaine : `map/`, `providers/`, `search/`, `claim/`,
  `forms/`, `home/`, `shared/`, et `ui/` (shadcn, généré).
- `src/lib/` — clients Supabase (`supabase/client.ts` navigateur,
  `supabase/server.ts` serveur avec clé anon ou service), `geo.ts`, `phone.ts`
  (normalisation E.164), `validations.ts` (schémas Zod partagés),
  `admin-auth.ts`.
- `src/middleware.ts` — protège `/admin` et `/api/admin` (jeton admin).
- `bot/` — service Node séparé (bot WhatsApp), déployé à part sur Railway ; il
  ne parle qu'à l'app (`APP_URL` + `BOT_SECRET`), **jamais à la base**.
- `supabase/migrations/` — schéma, à appliquer dans l'ordre.

## 4. Données

Le schéma de référence est **`supabase/migrations/`** (001 → 005), pas ce
document. Résumé :

| Table | Rôle |
|---|---|
| `categories` | 15 catégories de service (seed en 002), icône Lucide |
| `providers` | fiches ; `location GEOGRAPHY(POINT)` indexée GIST ; `contact_phone` = clé de revendication ; `claimed_at`/`claimed_by_phone` ; `disabled_at` (masquage admin, 004) ; `avg_rating`/`review_count` recalculés par trigger |
| `provider_categories` | N:M fiche ↔ catégorie |
| `provider_photos` | photos (pas de Storage Supabase utilisé à ce jour) |
| `reviews` | avis, 1 par numéro et par fiche (`reviewer_phone`) |
| `otp_claims` | codes OTP temporaires (avis) |
| `whatsapp_claims` | jetons de revendication via le bot (005), accès service uniquement |
| `reports` | signalements (fiche, avis), `reporter_ip` |
| `contacts` | comptage des mises en contact (appel, WhatsApp, itinéraire) |

- **Recherche géographique** : fonctions RPC `get_providers_near(lat, lng,
  radius_m, category_filter, search_query)` et `get_provider_by_id(id)`, qui
  renvoient des coordonnées lisibles (003/004) — le type GEOGRAPHY brut arrive
  en WKB hexadécimal côté client (`parseWkbPoint` dans `geo.ts`).
- **RLS** activée sur toutes les tables ; lecture publique sur les fiches,
  catégories, photos, avis ; écritures par la clé service depuis les routes API.
- **PostGIS est installé dans le schéma `public`** (pas `extensions`) : à
  respecter en cas de migration de projet.

### Données personnelles

`reviewer_phone`, `reporter_ip`, `claimed_by_phone`, `whatsapp_from`, et
demain les messages, sont des données personnelles qui **ne doivent pas être
exposées au public**. `contact_phone` est public par nature (c'est le moyen de
contact de la fiche). Voir l'état réel au §6.

## 5. Flux

**A — Chercheur.** Accueil (catégories + recherche) → géolocalisation (repli :
position par défaut Cotonou) → carte/liste triées → fiche → contact (`tel:`,
`wa.me/`, itinéraire) → avis (code OTP, 1 avis par numéro par fiche).

**B — Contributeur.** « Ajouter un prestataire » sans compte → formulaire
(nom, numéro, catégories, description, position par marker déplaçable) →
validation Zod client + serveur → fiche non revendiquée. Doublon de
`contact_phone` → bloquer et proposer la revendication.

**C — Revendication.** « C'est ma fiche » → l'app crée un jeton
(`whatsapp_claims`) → le prestataire l'envoie au bot WhatsApp depuis son
numéro → le bot transmet à l'app (webhook signé par `BOT_SECRET`) → fiche
revendiquée → tableau de bord.

**Admin.** `/admin` (mot de passe `ADMIN_SECRET`, jeton signé
`ADMIN_JWT_SECRET`) : fiches, signalements, avis ; recherche et pagination.

## 6. Authentification — état réel au 2026-10-22

- **Prestataire** : la vérification du code WhatsApp
  (`/api/claim/whatsapp/verify`) émet un cookie `provider_session` (JWT HS256,
  httpOnly, 30 jours, clé `PROVIDER_SESSION_SECRET`) portant le numéro et la
  fiche. Le même chemin reconnecte un propriétaire dont la fiche est déjà
  revendiquée par ce numéro. `src/lib/provider-session.ts`.
- **Modification de fiche** : `PATCH /api/providers/[id]` n'accepte que cette
  session, pour cette fiche, et revérifie en base que `claimed_by_phone` est
  toujours le numéro de la session (retirer la revendication coupe l'accès).
  L'état Zustand du navigateur ne sert plus qu'à l'affichage.
- **Sorties publiques** : toute fiche ou tout avis renvoyé au navigateur passe
  par `src/lib/public-data.ts`, qui retire `claimed_by_phone`, `location` et
  `reviewer_phone`.
- Corrigé le 2026-10-22 (tâche 1) : avant, le PATCH comparait un en-tête
  fourni par le client à `claimed_by_phone`, que l'API publique renvoyait —
  et une fiche non revendiquée était modifiable sans aucun en-tête.
- **Reste ouvert, non atteignable aujourd'hui** : en base, les politiques RLS
  dites « service » n'ont pas de rôle (`TO`) et s'appliquent donc à `anon` —
  lecture des codes OTP, des numéros, insertion d'avis. La clé anon n'est pas
  envoyée au navigateur (vérifié dans le bundle le 2026-10-22), mais une clé
  « publishable » est faite pour être publique : à durcir avant tout usage de
  Supabase côté client (backlog).

## 7. Hébergement et exploitation

- **Supabase** : projet migré vers un nouveau compte le 2026-10-22 (l'ancien
  était en pause). Clés au nouveau format (`sb_publishable_…` dans
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `sb_secret_…` dans
  `SUPABASE_SERVICE_ROLE_KEY`).
- **Maintien en vie** : cron Vercel quotidien → `/api/keep-alive` (protégé par
  `CRON_SECRET`) qui lit la base — ADR 0002. Le workflow GitHub
  `supabase-keep-alive.yml` reste en secours.
- **Vercel** : `main` = production ; les autres branches = previews.
