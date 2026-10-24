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

*(Mis à jour le 2026-10-24.)*

- **Production** : `main` sur Vercel, branchée sur le nouveau projet
  Supabase (vérifié le 2026-10-22). Première exécution du cron de maintien en
  vie **non constatée**.
- **Branches** : `dev`, `staging` et `main` poussées le 2026-10-24 ; `main`
  (6bad396) porte la tâche 1 et la refonte du front (lots 1 à 6). Le
  déploiement de production qui en découle n'a **pas** été constaté (on ne
  sonde pas la prod depuis ici).
- **Revendication en panne** : les deux numéros du bot WhatsApp (Baileys) ont
  été bannis. Aucune fiche ne peut être revendiquée, et le cas « propriétaire
  modifie sa fiche → 200 » reste non testé. **Vérification de numéro mise en
  pause** le 2026-10-24 : toute solution a un coût (numéro neuf, téléphone
  passerelle ou SMS). Bloque aussi la messagerie (tâche 3).
- **En cours** : refonte du front, brief validé le 2026-10-24 (voir
  `PRODUCT.md` et le backlog, « Refonte du front »). Lot 1 commité et fusionné
  dans `dev`, puis tous les lots jusqu'au 6 ; promus en `staging` et `main`.
- **Prochaine action** : recette sur un vrai téléphone (carte 3D, panneau
  à tirer, fiche) ; vérifier que la production a bien redéployé et que
  `PROVIDER_SESSION_SECRET` y existe.

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

### 2026-10-22 — Tâche 1 : session prestataire et sorties publiques

- Reproduit avant correctif (serveur local sur la base de prod) : la liste
  publique renvoyait la clé `claimed_by_phone` ; un `PATCH` **sans aucun
  en-tête** sur une fiche non revendiquée était accepté (200 — corps vide,
  seul `updated_at` a changé) : `null !== null` est faux.
- Correctif : cookie de session signé émis à la vérification du code WhatsApp
  (et reconnexion du propriétaire), seule autorité du `PATCH` ; filtre des
  sorties publiques ; code de revendication tiré au générateur
  cryptographique.
- Après : sans session, en-tête seul, cookie mal signé → 401 ; session valide
  sur une fiche non revendiquée ou sur une autre fiche → 403 ; liste, fiche
  et page sans numéro privé.
- Relecture sécurité indépendante : trois points introduits corrigés (secret
  faible ou indicatif refusé → 401 vérifié ; vérification en `text/plain`
  refusée → 415 vérifié ; consommation du code atomique, non testée faute de
  code réel). Trois points préexistants mis au backlog (OTP SMS forçable,
  code écrit dans les logs sans `BOT_URL`, `reporter_ip` renvoyé).
- Découvert : politiques RLS sans rôle (tâche 1 bis), chemins de revendication
  multiples.

### 2026-10-24 — Outils de front, brief de refonte, lot 1

- Bot WhatsApp banni (deux numéros). OpenWA écarté (même mécanisme non
  officiel que Baileys). Vérification par SMS entrant ou Telegram étudiée,
  puis **mise en pause** par décision : coût.
- Outils de front évalués ; `ui-ux-pro-max` et `playwright-cli` installés,
  méthode montée au brain (`00-methode/concevoir-le-front`).
- `PRODUCT.md` écrit (register product ; chaleureux et local, net et
  technique, premium ; charte gardée et modernisée). Brief en six lots validé.
- Lot 1 : charte passée en OKLCH avec neutres sable ; coque responsive
  (barre du bas sur téléphone, rail à gauche dès 1024 px) qui réserve sa
  place par variables CSS ; barre de contact de la fiche recalée ; calques
  Leaflet contenus. Mesuré à 390 et 1440 px : marge réservée = taille de la
  navigation, pas de défilement horizontal, barre de contact au-dessus de la
  carte. Build et typecheck verts.

- Lot 2 : les quatre cartes passent sur MapLibre + OpenFreeMap restylé
  (ADR 0004), Leaflet retiré. Vérifié à 390 et 1440 px : explorer, fiche (3D
  puis 2D au bouton), ajout (épingle déplaçable), itinéraire ouvert depuis la
  fiche (au-dessus de la navigation) ; console sans erreur. Non vérifié : le
  tracé d'itinéraire avec une vraie position GPS, le repli sans WebGL.

- Lot 3 : explorer refait. Téléphone : carte plein écran, recherche et
  catégories flottantes, résultats dans un panneau à trois crans (tiré à la
  main : vérifié haut, bas, toucher). Ordinateur : panneau de résultats à
  gauche, aperçu du prestataire à la place de la liste. Rayon en crans (2 à
  50 km), « Chercher dans cette zone » après un déplacement de la carte,
  bouton de localisation, état vide avec actions. Les paramètres `lat`/`lng`
  de l'URL sont enfin lus. Vérifié à 390, 768 et 1440 px. Non vérifié : sur un
  vrai téléphone tactile (glissés simulés à la souris).

- Lot 4 : fiche refaite. Plus de bandeau d'initiales ; identité, repères
  (adresse, rayon d'intervention, ancienneté), à propos, carte, réalisations,
  avis avec état vide qui invite au premier avis. Barre de contact du
  téléphone : boutons à pleine largeur (avant, coupés : le compteur de
  contacts les enveloppait dans un `span`) ; l'itinéraire est désormais
  compté aussi depuis la fiche. Ordinateur : deux colonnes, contact et carte
  à droite qui restent à l'écran. Une seule carte chargée selon l'écran.
  Vérifié à 390, 768 et 1440 px : aucun bouton tronqué, pas de défilement
  horizontal.

- Lot 5 : accueil refait. Titre fixe (fin du mot qui tournait et laissait un
  trou), recherche et « Autour de moi » d'abord, aperçu de carte réel avec le
  vrai nombre de prestataires à 10 km, les 15 métiers en pastilles (aucun
  nom coupé : mesuré), étapes, appel aux contributeurs et aux artisans, FAQ
  réécrite (vouvoiement, revendication en pause dite franchement, Bénin et
  Côte d'Ivoire). Retiré : le bouton WhatsApp « support » qui pointait vers
  un numéro factice (22900000000). Vérifié à 390, 768 et 1440 px ; recherche
  depuis l'accueil → explorer avec la requête.

- Lot 6 : tableau de bord refait. Disponibilité en premier, « qui vous a
  contacté » sur 7 jours (barres par jour, détail au survol, table pour
  lecteur d'écran, écart avec la semaine d'avant), « pour être choisi »
  (présentation, quartier, demander un avis par partage du lien), aperçu dans
  les résultats, avis. Sans session : un écran qui explique au lieu de
  renvoyer vers une revendication en panne. **Les statistiques n'étaient
  jamais chargées** (tableau vide en dur) : nouvelle route `GET
  /api/providers/[id]/contacts` réservée au propriétaire, contrôle partagé
  avec le PATCH (`src/lib/provider-owner.ts`). Mesuré : 401 sans cookie ou
  cookie mal signé, 403 session non revendiquée ou d'une autre fiche, 400 id
  invalide ; PATCH inchangé (401/403). Rendu vérifié avec des statistiques
  simulées (interception réseau) à 390 et 1440 px. Non testé : un vrai
  propriétaire (aucune fiche revendiquée).

## 🎓 Leçons apprises

*Une entrée dès qu'une erreur est commise et corrigée. Format : symptôme →
cause → règle. Ce qui vaut au-delà de ce projet monte dans le brain.*

### Un maintien en vie ne dépend pas de l'activité du dépôt (2026-10-22)
La base Supabase était en pause malgré un ping GitHub planifié.
Cause : GitHub coupe les workflows planifiés après 60 jours sans commit.
Règle : le cron vit chez l'hébergeur de l'app (Vercel) et se vérifie par sa
dernière exécution. → brain : `un-maintien-en-vie-ne-depend-pas-de-l-activite-qu-il-remplace`

### Une comparaison d'autorisation avec une valeur absente laisse passer (2026-10-22)
Une fiche non revendiquée était modifiable par n'importe qui sans en-tête.
Cause : le contrôle était `claimed_by_phone !== enTête`, et `null !== null`
est faux.
Règle : une autorisation commence par exiger la présence de la preuve, puis
la compare ; et ne repose jamais sur une valeur que le client fournit.

### Arrêter le serveur de dev par son PID (2026-10-22)
`pkill -f "next dev" ; …` a renvoyé le code 144 : le shell s'est tué lui-même.
Règle : `kill <PID>` dans une commande à part. → brain :
`arreter-un-processus-par-son-pid-pas-par-un-motif`

### Un CSS modifié qui ne change pas à l'écran : vider le cache Turbopack (2026-10-24)
Les nouveaux jetons de `globals.css` n'arrivaient pas au navigateur, même
après redémarrage du serveur de dev ; le fichier servi était l'ancien.
Cause : cache persistant de Turbopack (`.next/dev`) resté sur l'ancienne
version (WSL).
Règle : avant de douter du code, vérifier le CSS **servi** ; s'il est périmé,
arrêter le serveur (PID), supprimer `.next/dev`, relancer.

### Le port 3000 peut appartenir à un autre projet (2026-10-24)
`next dev` est passé sur 3001 en silence ; les premières mesures visaient
l'app d'un autre dépôt sur 3000.
Règle : lire le port dans la sortie du serveur, ou lancer avec `-p` explicite.

### Une feuille de style de bibliothèque importée hors couche écrase Tailwind (2026-10-24)
La carte de la fiche avait une hauteur nulle : `absolute inset-0` était
ignoré sur son conteneur.
Cause : `maplibre-gl.css` importé sans couche ; ses règles (`position:
relative`) battent les utilitaires Tailwind v4, qui vivent dans une couche.
Règle : importer une feuille tierce avec `layer(components)`.

### Une instance créée après un démontage casse sa jumelle (2026-10-24)
En développement, la carte du formulaire s'affichait en haut de la page.
Cause : double montage de React ; la première carte, créée après le
démontage puis détruite, retirait les classes du conteneur partagé avec la
seconde.
Règle : vérifier l'annulation **avant** de créer une ressource asynchrone,
pas après.

### `git stash` puis `git stash pop` peut désindexer une suppression (2026-10-24)
Le commit du lot 2 a gardé l'ancien `ProviderMarker.tsx` alors que sa
suppression avait été indexée : un `stash`/`pop` fait entre-temps l'avait
remise en suppression non indexée, et le `git add` nominatif ne la citait pas.
Règle : relire `git status` juste avant le commit et inclure les suppressions
(`D` en seconde colonne) dans la liste nominative.

### Une table en `sr-only` déborde quand même (2026-10-24)
La page du tableau de bord défilait horizontalement sur téléphone (425 px
pour 390). Cause : une `<table>` ignore la largeur de 1 px de `sr-only`.
Règle : masquer le conteneur de la table, pas la table ; et mesurer
`scrollWidth` à chaque largeur, une capture ne le montre pas toujours.
