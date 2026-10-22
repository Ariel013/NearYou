# À FAIRE — actions manuelles, opérationnelles et externes en attente

Ce fichier recense tout ce qui doit être fait **hors code** : comptes à créer,
secrets à renseigner, migrations à appliquer, décisions produit/juridiques à
trancher, prérequis externes.

> **Règle de tenue :** dès qu'une tâche fait apparaître une action manuelle ou
> externe, elle est ajoutée ici **dans la même tâche**, avec la date. On ne
> laisse aucun prérequis implicite.

Dernière mise à jour : 2026-10-22.

> 📎 Les **commandes** elles-mêmes sont dans `docs/commandes.md`. Ce fichier-ci
> dit *ce qui reste à faire et pourquoi* ; l'autre dit *comment le lancer*.

---

## 1. Variables d'environnement / secrets

À tenir identiques dans `.env.local`, Vercel (Production + Preview) et, pour
les deux premières, les secrets GitHub (workflow de secours).

| Variable | Où l'obtenir | Statut |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | en place (nouveau projet, 2026-10-22) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `sb_publishable_…` | en place |
| `SUPABASE_SERVICE_ROLE_KEY` | clé `sb_secret_…` — serveur uniquement | en place |
| `CRON_SECRET` | aléatoire ≥ 32 caractères | en place dans Vercel (2026-10-22) |
| `BOT_URL`, `BOT_SECRET` | URL Railway du bot ; secret partagé avec `bot/.env` | requises |
| `ADMIN_SECRET`, `ADMIN_JWT_SECRET` | aléatoires | requises |
| `AFRICA_TALKING_API_KEY`, `AFRICA_TALKING_USERNAME` | Africa's Talking | **absentes de `.env.example`** ; sans elles, le code OTP des avis n'est pas envoyé (tâche 2) |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MAP_TILE_URL`, `NEXT_PUBLIC_DEFAULT_*` | config | en place |

- ⚠️ Ne jamais committer `.env.local`.

## 2. Comptes / services externes

| Service | Usage | Statut |
|---|---|---|
| Supabase (nouveau compte) | base de production | actif depuis le 2026-10-22 ; **garder ce compte à ce seul projet** (limite de 2 projets gratuits actifs) |
| Supabase (ancien compte) | ancienne base | **à supprimer** (données migrées et vérifiées le 2026-10-22) |
| Vercel | app + cron | actif |
| Railway | bot WhatsApp | actif (non revérifié le 2026-10-22) |
| GitHub | dépôt, workflow de secours, CI | actif |

## 3. Migrations à appliquer

| Migration | Environnement | Statut |
|---|---|---|
| 001 → 005 | production (nouveau projet) | appliquées (copie du schéma réel, 2026-10-22) |

## 4. Décisions en attente

| Question | Qui tranche | Échéance | Impact si non tranché |
|---|---|---|---|
| Hors périmètre : paiement en ligne ? appli mobile native ? | Kevin | avant la tâche 3 | risque de sur-développement |
| Durée de conservation des messages | Kevin | avant la tâche 3 | données personnelles gardées sans limite |
| Changer le mot de passe de la base Supabase (passé par un fichier local à la migration) | Kevin | dès que possible | — |
| Base de développement distincte de la prod | Kevin | avant les premiers vrais usagers | `npm run dev` écrit dans la prod |

## 5. Ops et sauvegardes

- **Maintien en vie** : cron Vercel quotidien (ADR 0002). Vérifier son
  exécution dans Vercel → Cron Jobs ; la première exécution réussie reste à
  constater.
- **Sauvegardes** : celles du plan gratuit Supabase uniquement — leur
  fréquence et leur restaurabilité **n'ont pas été vérifiées**. Aucune
  sauvegarde exportée hors de Supabase.
- Non couvert : le bot WhatsApp (sa session Baileys sur Railway).
