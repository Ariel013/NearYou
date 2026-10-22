# GéoService (NearYou) — contexte projet pour Claude Code
@AGENTS.md

Lis ce fichier en entier avant toute tâche. Il pointe vers les docs de
référence — lis aussi celles qui concernent ta tâche avant de coder.

> **⚡ EN TOUT PREMIER, à chaque nouvelle session : lis `JOURNAL.md`.**
> C'est le fil de continuité (où on en est, la prochaine action, les leçons
> apprises). Tu le **mets à jour en fin de session**.

## Le projet en une phrase

Annuaire géolocalisé de prestataires de services de proximité (artisans,
ménage, coursiers…) au Bénin et en Côte d'Ivoire, alimenté par la communauté et
revendiqué par les prestataires — **en ligne, sans vrais usagers** à ce jour.

## Où en est le projet — LIS CECI AVANT TOUTE CHOSE

- **Phase actuelle : MVP en ligne, avant le lancement.** Les écrans du MVP
  existent, mais ne suppose pas qu'ils sont recettés.
- **Constat ouvert** : la modification d'une fiche revendiquée n'est pas
  réellement protégée et des numéros d'auteurs d'avis sont exposés
  (`docs/architecture.md` §6). C'est la tâche 1 du backlog : rien ne se
  construit sur l'authentification actuelle.
- **À venir** : messagerie avec compte léger (ADR 0001).
- **Pas de base de développement** : `npm run dev` écrit dans la base de
  production.

## Stack technique

- Next.js 16 (App Router), React 19, TypeScript strict — **lire
  `node_modules/next/dist/docs/` avant de coder** (`AGENTS.md`).
- Tailwind v4 + shadcn/ui, Leaflet/OpenStreetMap, Zustand, React Hook Form + Zod.
- Supabase (PostgreSQL 17 + PostGIS, plan gratuit), client direct sans ORM.
- Vercel (app, cron de maintien en vie), Railway (bot WhatsApp de `bot/`).

## Documents de référence — à consulter selon la tâche

| Doc | Quand le lire |
|---|---|
| `JOURNAL.md` | **En tout premier, à chaque session.** |
| `A-FAIRE.md` | Pour les actions manuelles/externes en attente |
| `docs/architecture.md` | Avant toute décision structurante (vision, données, flux, auth) |
| `docs/conventions-code.md` | Avant d'écrire du code (nommage, qualité, design) |
| `docs/workflow-git.md` | Avant tout commit |
| `docs/commandes.md` | Aide-mémoire des commandes — et de celles à ne jamais lancer |
| `docs/decisions/` | Avant de remettre en cause un choix déjà fait |
| `docs/roadmap-backlog.md` | Au démarrage de chaque session |
| `supabase/migrations/` | Le schéma de référence de la base |

## Règles d'or, non négociables

1. **Ne jamais faire `git push` sans confirmation explicite, à chaque fois.**
2. **Aucune route publique ne renvoie une donnée personnelle** (numéro
   d'auteur d'avis, de propriétaire, IP, message) ; aucun secret côté client ;
   toute route valide avec Zod avant la base. Revue `security-audit` (mode
   guidance, sur le diff) avant chaque rapport de tâche.
3. **Sur une décision d'architecture ambiguë, s'arrêter et demander** plutôt
   que d'improviser silencieusement — puis l'écrire en ADR avec le code.
4. **Chercher, voir une fiche et contacter restent possibles sans compte.**
   Seule la messagerie exige un numéro vérifié (ADR 0001).
5. Branches `main` ← `staging` ← `dev` ← `<type>/<slug>`, jamais de commit
   direct sur les trois premières ; migrations additives uniquement ; RLS sur
   toute nouvelle table.

## Après chaque tâche — format de rapport attendu

Tout retour de l'agent — rapport de fin de tâche ou réponse en cours de
session — donne **l'utile seulement** (format du coffre,
`brain/00-methode/rapport-de-tache.md`) :

```
## <la tâche en une ligne>
**Fait** : actions effectuées et résultat mesuré ; ce qui reste non vérifié
**Sécurité** : revue du diff faite → constats ; ou non faite → pourquoi
**Challenge** : ce que je remets en cause dans ce qui est proposé ou à faire, et ma recommandation
**À toi** : décisions à prendre, actions manuelles, dans l'ordre
**Commit proposé** : <message exact, non encore exécuté>
```

Pas de liste de fichiers, pas de code, pas de commandes, pas de compte rendu
brut de sous-agent : l'agent les vérifie et ne les remonte que s'ils changent
une décision. Un changement de schéma, d'auth, de données personnelles ou une
décision qui mériterait un ADR se signale toujours, en une ligne.

L'utilisateur valide le commit avant qu'il ne soit fait.

## Continuité entre sessions

1. **Reprise sans relecture du code** : `JOURNAL.md` + ce fichier suffisent.
2. **Apprendre des erreurs** : toute erreur corrigée est consignée dans
   « Leçons apprises » de `JOURNAL.md`.
3. **Être force de proposition** : après avoir pris l'état, recommander la
   suite — ne pas lister des options.

En fin de session, mettre à jour `JOURNAL.md`. C'est la condition de la reprise.
