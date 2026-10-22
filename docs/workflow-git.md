# Workflow git — GéoService

> Dérivé de la méthode commune (`~/PROJETS/brain/00-methode/workflow-git.md`),
> adapté au déploiement Vercel de ce dépôt. À lire avant tout commit.

## La règle absolue

**Jamais de `git push` sans confirmation explicite, à chaque fois.** Le reste
(branche, `add`, `commit`, fusion locale, tag), l'agent l'exécute lui-même et
l'annonce.

## Branches (en place depuis le 2026-10-22)

```
main       ← PRODUCTION (Vercel déploie main en prod). Ne reçoit que staging.
 └ staging  ← RECETTE. Preview Vercel : on y vérifie avant la prod.
    └ dev    ← INTÉGRATION. On y teste tout.
       └ <type>/<slug>  ← une branche par tâche, issue de dev.
```

- **Jamais de commit direct** sur `main`, `staging`, `dev` : uniquement des
  fusions.
- Une tâche = une branche = un sujet. `type` ∈ `feat`, `fix`, `refactor`,
  `docs`, `chore`, `test`, `style` — le plus précis.
- Remontée **un niveau à la fois**, vérifiée à chaque niveau (la preview
  Vercel de `staging` se regarde avant de fusionner dans `main`).
- Le hook local `.git/hooks/pre-push` refuse force-push et suppression sur
  `main`, `staging`, `dev`. Il n'est pas versionné : à recopier depuis
  `docs/commandes.md` sur une nouvelle machine.

## Promotion et release

- Promotion **en local** : fusions non fast-forward `dev → staging → main`,
  tag, puis push (avec confirmation). Pas de PR web `dev → main`.
- Avant de pousser `main` : rattraper `origin/main` en fast-forward si besoin,
  vérifier `git diff main staging` vide, puis taguer (`v0.2`, `v0.3`…). Le tag
  est l'ancre de rollback.
- Jamais de `reset --hard` sur une branche partagée.
- Une release se coupe sur un périmètre décidé, pas sur l'état de `dev`.

## Séquence d'une tâche

1. Lire `JOURNAL.md` et les docs que `CLAUDE.md` désigne.
2. Brancher `<type>/<slug>` depuis `dev` à jour.
3. Coder.
4. Vérifier : typecheck, lint, build, **et regarder l'application**.
5. Revue sécurité du diff (`security-audit`, mode guidance).
6. Rapport de tâche → validation.
7. `git add <chemins nommés>` (jamais `git add .` ni `-A`) puis commit.
8. Fusion dans `dev`, puis remontée sur demande. Confirmation avant chaque push.
9. Mettre à jour `A-FAIRE.md`, `docs/roadmap-backlog.md`, `JOURNAL.md`.

## Format de commit

```
<type>: <résumé court à l'impératif, en français>

<corps optionnel : le pourquoi>

Co-Authored-By: …
```

Jamais, dans un message de commit, une propriété qui n'a pas été mesurée.

## Ce qu'on ne fait jamais silencieusement

- Modifier le schéma de base (nouvelle migration) sans le signaler.
- Toucher à l'authentification, aux sessions ou aux données personnelles
  (numéros, IP, messages) sans revue de sécurité.
- Ajouter une dépendance sans la nommer.
