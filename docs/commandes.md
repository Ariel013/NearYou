# Commandes — GéoService

> *Comment je lance ça — et ce qu'il ne faut jamais lancer.*

## Développement

| Commande | Effet |
|---|---|
| `npm ci` | installe les dépendances à l'identique du `package-lock.json` |
| `npm run dev` | serveur de développement (port 3000), sur la base **réelle** de `.env.local` |
| `npx tsc --noEmit` | vérification des types |
| `npm run lint` | ESLint |
| `npm run build` | build de production |

⚠️ Il n'existe **pas de base de développement séparée** : `npm run dev` lit et
écrit dans la base de production. Créer une fiche en local crée une vraie
fiche.

Arrêter un serveur lancé en arrière-plan : par son PID (`kill <PID>`), **jamais**
`pkill -f "next dev"` dans une commande qui contient le motif — le shell se tue
lui-même (code 144) et la suite n'a pas lieu.

## Base de données

Les migrations se jouent dans l'ordre (`supabase/migrations/001…`) via l'éditeur
SQL Supabase ou `psql`. Le client `pg_dump`/`pg_restore` doit avoir **la même
version majeure que le serveur** (17) : `/usr/lib/postgresql/17/bin/`.

🔴 **À ne jamais lancer sur la base de production sans sauvegarde vérifiée** :
une migration contenant `DROP`, un `pg_restore --clean`, un `TRUNCATE`, ou une
réexécution des migrations 003/004 (elles `DROP` puis recréent les fonctions
RPC — sans danger pour les données, mais la recherche est cassée entre les
deux).

## Maintien en vie

Déclencher le cron à la main : Vercel → Settings → Cron Jobs → Run sur
`/api/keep-alive`. Réponse attendue : `{"data":{"alive":true},"error":null}`.

## Hook pre-push (non versionné)

À poser dans `.git/hooks/pre-push` (exécutable) sur toute nouvelle copie :

```sh
#!/bin/sh
# Refuse force-push et suppression sur les branches longues.
protegees="main staging dev"
while read local_ref local_sha remote_ref remote_sha; do
  branche=${remote_ref#refs/heads/}
  for p in $protegees; do
    if [ "$branche" = "$p" ]; then
      if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
        echo "pre-push : suppression de $p refusée" >&2; exit 1
      fi
      if [ "$remote_sha" != "0000000000000000000000000000000000000000" ] && ! git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
        echo "pre-push : push non fast-forward sur $p refusé" >&2; exit 1
      fi
    fi
  done
done
exit 0
```
