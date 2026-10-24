# 0004 — Les cartes passent de Leaflet à MapLibre sur les tuiles OpenFreeMap

**Statut** : adopté (2026-10-24) — lot 2 de la refonte du front

## Contexte

La carte est le cœur du produit (`PRODUCT.md`). Elle s'affichait avec Leaflet
sur les tuiles raster d'OpenStreetMap : rendu brut, impossible à mettre aux
couleurs de la charte, pas de vue inclinée. L'utilisateur veut une carte
« 3D, très belle et parfaite », sans abonnement payant.

## Décision

- **MapLibre GL JS** (6.15) remplace Leaflet partout : explorer, fiche,
  ajout d'un prestataire, itinéraire. Leaflet est désinstallé.
- **Tuiles vectorielles OpenFreeMap** (style « liberty », gratuites, sans clé
  ni compte), **recolorées au chargement** aux couleurs de la charte (sable,
  eau bleue, routes crème et ambre) ; points d'intérêt génériques retirés pour
  que les épingles ressortent. Socle : `src/components/map/brand-map.ts`.
- **Vue inclinée avec bâtiments en relief** par défaut sur grand écran et sur
  la fiche ; à plat par défaut sur téléphone ; bouton 3D / 2D sur chaque
  carte.
- **Repli** : sans WebGL ou si le style est injoignable, un message et un lien
  vers OpenStreetMap à la place de la carte.

## Pourquoi

- Le style vectoriel se recolore couche par couche : c'est ce qui donne une
  carte « à nous », impossible avec des images de tuiles.
- OpenFreeMap n'impose ni clé ni quota : pas de compte de plus, pas de
  facture, pas de clé à protéger.
- MapLibre est la bibliothèque libre de référence pour ce rendu (fork libre de
  Mapbox GL).

## Conséquences

- **Poids** : le code de carte pèse environ 288 Ko compressés plus un worker
  de 147 Ko compressés (mesuré sur le build du 2026-10-24), chargés seulement
  sur les écrans qui ont une carte. Leaflet était bien plus léger ; le poids
  des tuiles vectorielles face aux tuiles raster n'a pas été mesuré.
- Le worker de MapLibre est copié dans `public/` avant `dev` et `build`
  (`scripts/copy-maplibre-worker.mjs`) : sans ça, il est introuvable une fois
  passé par Turbopack.
- La feuille de style de MapLibre est importée dans la couche `components` :
  importée hors couche, elle écrasait les utilitaires Tailwind (carte de
  hauteur nulle).
- Dépendance à un service tiers gratuit (OpenFreeMap) : s'il tombe, le repli
  s'affiche. Une autre source compatible (auto-hébergement des tuiles,
  MapTiler) se branche en changeant l'URL du style.
- Les couleurs de la carte sont en hexadécimal dans `brand-map.ts` (MapLibre
  ne lit pas l'OKLCH) : à tenir alignées sur `globals.css`.
