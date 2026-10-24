# Roadmap et backlog — GéoService

> *Que reste-t-il à construire, dans quel ordre ?* Lu au démarrage de session.
> Ordre fixé à l'amorce du 2026-10-22.

## Déjà présent dans le code (non recetté écran par écran)

Accueil (catégories, recherche, géolocalisation), carte + liste
(`/providers`), fiche en SSR (`/providers/[id]`), création de fiche avec
`LocationPicker` (`/providers/new`), revendication par bot WhatsApp
(`/claim`), tableau de bord prestataire (`/dashboard`), avis et signalements,
back-office `/admin` (fiches, signalements, avis, recherche, pagination),
maintien en vie Supabase (ADR 0002).

---

## Tâche 1 — Fermer la modification de fiche par un tiers — ✅ faite le 2026-10-22 (en attente de déploiement)

**Contexte** : constat de l'amorce (lecture du code, non reproduit) — la
route publique d'une fiche renvoie `claimed_by_phone` et les avis complets,
et la modification de fiche n'est autorisée que par un en-tête égal à ce
numéro. Voir `docs/architecture.md` §6. Pas de vrais usagers à ce jour : c'est
le moment de corriger.

**Objectif** : seul le propriétaire vérifié d'une fiche peut la modifier, et
aucune route publique ne renvoie de numéro autre que `contact_phone`.

**Critères d'acceptation** :
- Le défaut est d'abord reproduit en local par un test (avant / après).
- La modification exige une session serveur (cookie signé, httpOnly) émise à
  la revendication ; l'en-tête `x-provider-phone` n'est plus accepté.
- `GET /api/providers/[id]` et la page fiche ne renvoient ni
  `claimed_by_phone` ni `reviewer_phone`.
- Revue `security-audit` (guidance) sur le diff, sans constat ouvert.

**Hors périmètre** : la messagerie (tâche 3).

## Tâche 2 — Vérifier l'envoi du code OTP des avis en production — à faire

**Contexte** : sans clé Africa's Talking, le code n'est qu'écrit dans les logs
— l'usager ne le reçoit pas et ne peut pas laisser d'avis.

**Objectif** : savoir si un avis peut être posté en production, et sinon,
faire passer le code par le bot WhatsApp comme la revendication.

**Critères d'acceptation** : un avis posté depuis la prod par un numéro de
test, relu en base.

## Refonte du front — en cours (brief validé le 2026-10-24)

**Contexte** : `PRODUCT.md`. Méthode : skill impeccable (shape avant chaque
surface), captures à 390 / 768 / 1440 px avant chaque rapport.

| Lot | Contenu | État |
|---|---|---|
| 1 | Charte OKLCH (neutres sable), coque responsive : barre du bas / rail desktop | fait (2026-10-24) |
| 2 | Carte MapLibre + OpenFreeMap, style aux couleurs de la charte, bâtiments 3D, repli — ADR 0004 | fait, non commité |
| 3 | Explorer : panneau glissant sur téléphone, liste + carte côte à côte sur desktop, état vide | fait, non commité |
| 4 | Fiche : barre de contact lisible, « Pas encore d'avis », mini-carte, panneau latéral desktop | à faire |
| 5 | Accueil : recherche d'abord, catégories entières, « près de vous », texte Bénin + Côte d'Ivoire | à faire |
| 6 | Tableau de bord : contacts de la semaine par type, complétude, avis, aperçu de la fiche | à faire |

## Vérification de numéro — en pause (décision du 2026-10-24)

Bot WhatsApp banni ; toute alternative a un coût (numéro neuf pour l'API
officielle, téléphone passerelle SMS, SMS sortants). Pistes étudiées : SMS
entrant via une passerelle Android et une puce existante ; bot Telegram
(contact partagé = numéro vérifié, gratuit, peu répandu chez les artisans).
**Conséquence** : revendication impossible, tâche 3 bloquée.

## Tâche 3 — Messagerie avec compte léger — bloquée (vérification de numéro en pause)

**Contexte** : ADR 0001.

**Objectif** : un client au numéro vérifié écrit à un prestataire ayant
revendiqué sa fiche ; le prestataire lit et répond depuis sa boîte.

**Critères d'acceptation** :
- Tables conversations/messages en migration additive, RLS par participant.
- Un tiers (autre numéro vérifié, ou anonyme) ne lit aucun message : testé.
- Fiche non revendiquée : pas de bouton message, appel/WhatsApp conservés.
- Notification du prestataire décidée (WhatsApp ?) et écrite en ADR.

**Hors périmètre** : pièces jointes, appels, paiement.

## Tâche 1 bis — Durcir les politiques RLS — à faire (avant tout Supabase côté client)

**Contexte** : constat de la tâche 1 (`docs/architecture.md` §6). Les
politiques « service » s'appliquent à tous les rôles ; avec la clé anon, on lit
`otp_claims`, `reports`, les numéros, et on insère des avis. Non atteignable
tant que la clé anon reste côté serveur.

**Objectif** : la clé anon ne lit que les colonnes publiques et n'écrit rien.

**Critères d'acceptation** : migration 006 additive (suppression des
politiques sans rôle, droits par colonne sur `providers` et `reviews`,
`EXECUTE` des RPC retiré à `anon`) ; testée sur une base jetable avant la
prod ; le maintien en vie (lecture de `categories` en anon) fonctionne encore.

## Plus tard (non ordonné)

- OTP SMS (`/api/otp/send`, `/api/otp/verify`) : code à 6 chiffres tiré par
  `Math.random`, aucune limite de tentatives — un code se force en 10⁶ essais
  pendant ses 10 minutes, ce qui marque une fiche revendiquée ou poste un avis
  au nom d'un numéro (sans ouvrir de session). À traiter avec la tâche 2 :
  générateur cryptographique et plafond de tentatives par numéro.
- `/api/claim/whatsapp/init` : sans `BOT_URL`, le code part dans les logs et
  la route répond « envoyé » — échouer en production.
- `POST /api/providers/[id]/reports` renvoie `reporter_ip` à l'auteur du
  signalement : retirer le champ.
- Sessions prestataire non révocables avant 30 jours (hors retrait de la
  revendication par l'admin).
- Unifier les chemins de revendication : le webhook du bot revendique avec le
  numéro WhatsApp de l'expéditeur sans ouvrir de session, et l'ancienne route
  `otp/verify` (SMS) revendique encore une fiche. Garder un seul chemin.

- Corriger les 6 erreurs ESLint existantes (2026-10-22 : hooks appelés
  conditionnellement, `setState` dans un effet, apostrophes non échappées),
  puis ajouter le lint à la CI.
- Renommer `src/middleware.ts` en `proxy.ts` (convention dépréciée en Next 16,
  avertissement au build).

- Réponse du prestataire aux avis.
- Recherche textuelle plein texte (nom, bio, catégorie).
- Fusion de doublons depuis l'admin.
- Une base de développement distincte de la production.
