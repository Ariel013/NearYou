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

## Tâche 1 — Fermer la modification de fiche par un tiers — à faire

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

## Tâche 3 — Messagerie avec compte léger — à faire (après la tâche 1)

**Contexte** : ADR 0001.

**Objectif** : un client au numéro vérifié écrit à un prestataire ayant
revendiqué sa fiche ; le prestataire lit et répond depuis sa boîte.

**Critères d'acceptation** :
- Tables conversations/messages en migration additive, RLS par participant.
- Un tiers (autre numéro vérifié, ou anonyme) ne lit aucun message : testé.
- Fiche non revendiquée : pas de bouton message, appel/WhatsApp conservés.
- Notification du prestataire décidée (WhatsApp ?) et écrite en ADR.

**Hors périmètre** : pièces jointes, appels, paiement.

## Plus tard (non ordonné)

- Corriger les 6 erreurs ESLint existantes (2026-10-22 : hooks appelés
  conditionnellement, `setState` dans un effet, apostrophes non échappées),
  puis ajouter le lint à la CI.
- Renommer `src/middleware.ts` en `proxy.ts` (convention dépréciée en Next 16,
  avertissement au build).

- Réponse du prestataire aux avis.
- Recherche textuelle plein texte (nom, bio, catégorie).
- Fusion de doublons depuis l'admin.
- Une base de développement distincte de la production.
