# 🧭 Journal de bord — GéoService (NearYou)

> **Nouvelle session : LIS CE FICHIER EN PREMIER**, puis `CLAUDE.md`. Tu sauras
> où on en est, quoi faire ensuite et quoi éviter — sans relire tout le code.
>
> **Discipline** :
> 1. Au **démarrage** : lire les trois sections ci-dessous, puis agir / proposer.
> 2. En **fin de session** : mettre à jour « État & prochaine action », ajouter
>    une entrée au journal des sessions, consigner toute erreur en « Leçons ».
> 3. Convertir les dates relatives en absolues. Rester concis.

Carte des documents : `CLAUDE.md` (règles, carte), `A-FAIRE.md` (hors code),
`docs/architecture.md` (comment et pourquoi), `docs/decisions/` (ADR),
`docs/conventions-code.md`, `docs/workflow-git.md`, `docs/commandes.md`
(et ce qu'il ne faut jamais lancer), `docs/roadmap-backlog.md` (quoi ensuite).

---

## 📍 État actuel & prochaine action

*(Mis à jour le 2026-10-22.)*

- **Production** : `main` sur Vercel, branchée sur le **nouveau projet
  Supabase** — **vérifié** le 2026-10-22 par une fiche créée depuis le site en
  ligne et relue dans la nouvelle base. Cron de maintien en vie poussé
  (`ed5cfa4`) ; sa première exécution réussie n'a **pas** été constatée.
- **Branches** : `staging` et `dev` créées localement depuis `main` le
  2026-10-22, **pas encore poussées**.
- **Prochaine action** : tâche 1 du backlog — fermer la modification de fiche
  par un tiers et l'exposition des numéros (constat de lecture, à reproduire
  d'abord par un test). Critère de fin dans `docs/roadmap-backlog.md`.

## 📓 Journal des sessions

### 2026-10-22 — Migration Supabase, maintien en vie, amorce du projet

- Le projet Supabase gratuit était en pause. Restauré temporairement, puis
  base copiée vers un projet sur un nouveau compte (schéma `public` réel +
  données ; PostGIS recréé dans `public`). Comparaison ancien/nouveau
  identique : lignes par table, politiques et activation RLS, fonctions,
  triggers, index, droits des rôles ; RPC testées sous le rôle `anon`.
  Copies locales et chaînes de connexion supprimées ensuite.
- Cause de la pause : le workflow GitHub de ping s'éteint après 60 jours sans
  commit (dernier : 2026-06-29). Remplacé par un cron Vercel quotidien (ADR
  0002), GitHub gardé en secours.
- Amorce : `CLAUDE.md` réduit aux règles et à la carte des docs ; la spec
  produit est passée dans `docs/architecture.md` (corrigée : Next 16, bot
  WhatsApp, pas de Prisma) et `docs/conventions-code.md`. ADR 0001 (messagerie
  avec compte léger), 0002, 0003 (pas de multi-clients). Branches
  `main ← staging ← dev`, hook pre-push, sous-agents de revue, CI.
- **Découvert à l'amorce** (lecture du code) : `claimed_by_phone` et
  `reviewer_phone` renvoyés par la route publique d'une fiche, alors que le
  premier sert d'unique autorisation pour la modifier. Non reproduit, non
  testé en prod. Devenu la tâche 1.
- Ouvert : hors périmètre à confirmer (paiement en ligne, appli native) ;
  OTP des avis peut-être inopérant en prod (tâche 2).

## 🎓 Leçons apprises

*Une entrée dès qu'une erreur est commise et corrigée. Format : symptôme →
cause → règle. Ce qui vaut au-delà de ce projet monte dans le brain.*

### Un maintien en vie ne dépend pas de l'activité du dépôt (2026-10-22)
La base Supabase était en pause malgré un ping GitHub planifié.
Cause : GitHub coupe les workflows planifiés après 60 jours sans commit.
Règle : le cron vit chez l'hébergeur de l'app (Vercel) et se vérifie par sa
dernière exécution. → brain : `un-maintien-en-vie-ne-depend-pas-de-l-activite-qu-il-remplace`

### Arrêter le serveur de dev par son PID (2026-10-22)
`pkill -f "next dev" ; …` a renvoyé le code 144 : le shell s'est tué lui-même.
Règle : `kill <PID>` dans une commande à part. → brain :
`arreter-un-processus-par-son-pid-pas-par-un-motif`
