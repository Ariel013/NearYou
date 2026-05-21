# Stitch Analysis — GéoService Proximité Direct

> Project ID: `13494515242738838383`
> Updated: 2026-05-16 | Mode: Mobile / Light
> 5 screens analyzed

---

## Écran 1 — Accueil / Catalogue de Services

**Titre Stitch :** Accueil - Catalogue de Services
**Dimensions :** 390×2374px (mobile)
**Route cible :** `/`

### Structure & Composants

| Zone | Composant | Détails |
|------|-----------|---------|
| Header | Logo + Titre | "Google NearMe" (→ "GéoService") avec icône localisation |
| Header | Avatar utilisateur | Cercle, top-right |
| Recherche | `SearchBar` | Champ texte "Rechercher un service…" |
| Catégories | `CategoryGrid` | Grille 2×2 visible : Ménage (Sparkles), Plomberie (Wrench), Électricité (Zap), Coursier (Bike). Lien "Voir tout" |
| Section Explore | `ExploreSection` | Titre "Explorer les environs", texte "12 prestataires disponibles à proximité", bouton flèche |
| Cartes prestataires | `ProviderCard` ×2 | Avatar circulaire + badge vérifié, Nom, Spécialité, Note étoiles (4.9, 4.8), Distance (icône localisation), Badge "RECOMMANDÉ" |
| CTA | `CallToAction` | Titre "Besoin d'un coup de main?", description, bouton "Poster une demande" |
| FAB | Bouton flottant | Icône "+" (→ Ajouter un prestataire) |
| Navigation | `BottomNav` | 4 onglets : Accueil, Carte, Quartier (→ Explorer), Profil |

### Couleurs observées
- Fond : blanc / gris très clair
- Accent : bleu (icônes, liens, boutons primaires)
- Notes : or/ambre
- Texte secondaire : gris

### Flux sortant
- Clic catégorie → `/providers?category=xxx`
- Clic "Explorer les environs" → `/providers`
- Clic card prestataire → `/providers/[id]`
- Clic FAB "+" → `/providers/new`

---

## Écran 2 — Carte Interactive des Prestataires

**Titre Stitch :** Carte Interactive des Prestataires
**Dimensions :** 780×1768px (mobile scroll)
**Route cible :** `/providers`

### Structure & Composants

| Zone | Composant | Détails |
|------|-----------|---------|
| Header | Barre navigation | Icône localisation + titre + icône recherche + icône filtre |
| Filtres | `CategoryChips` | Chips horizontaux scrollables : Ménage (mop), Réparation, Plomberie, Animaux (chien), Jardinage |
| Carte | `MapView` | Carte interactive plein-écran avec marqueurs de prestataires, icône "my_location" (position utilisateur) |
| Liste | `ProviderList` | Cards sous la carte (ou vue switchable) |
| Card prestataire | `ProviderCard` | Photo + badge "Verified", Nom, Tarif horaire ("25€/h"), Description tronquée, Distance ("248m", "600m", "1.2km"), Bouton "Request" (→ "Contacter") |
| Navigation | `BottomNav` | 4 onglets identiques |

### Prestataires mockup
- Devon Lane — Ménage — 25€/h — 248m
- Mike Edward — Plomberie — 40€/h — 600m
- Serena Gomez — Garde d'enfants — 18€/h — 1.2km

### Flux sortant
- Clic marker carte → ouvre `ProviderSheet` (bottom sheet)
- Clic card → `/providers/[id]`
- Icône filtre → panneau filtres (rayon, catégorie, disponibilité)

---

## Écran 3 — Fiche Prestataire (version courte)

**Titre Stitch :** Fiche Prestataire - Jean Dupont (390×884px)
**Route cible :** `/providers/[id]` (vue partielle / ProviderSheet)

### Structure & Composants

| Zone | Composant | Détails |
|------|-----------|---------|
| Header | Bouton retour + partage | Flèche retour, icône partage, badge "Vérifié" |
| Profil | Avatar + Infos | Photo circulaire, Nom "Jean Dupont - Plombier Expert", Note 4.9 (124 avis), Localisation "Paris 15ème" (→ Quartier), Prix "À partir de 40€/h" |
| Services | Grid 2×2 | Cartes service : Titre + Description + Prix (Dès 40€ / Sur devis / +25€) |
| Avis | `ReviewCard` | "Avis Clients" + lien "Laisser un avis", carte avec avatar, nom, date, étoiles, texte |
| Contact | Boutons CTA | 3 boutons : Appeler (phone), WhatsApp (chat), Email (mail → remplacé par Itinéraire selon CLAUDE.md) |
| Pied | Délai réponse | "Temps de réponse habituel : 15 min" |
| Navigation | `BottomNav` | 4 onglets |

---

## Écran 4 — Fiche Prestataire (version longue/complète)

**Titre Stitch :** Fiche Prestataire - Jean Dupont (780×4424px)
**Route cible :** `/providers/[id]` (page complète SSR)

### Sections supplémentaires vs écran 3

| Zone | Composant | Détails |
|------|-----------|---------|
| Galerie | `PhotoGallery` | Grille de photos portfolio |
| Services complets | Liste étendue | Tous les services détaillés |
| Avis multiples | `ReviewList` | Plusieurs avis empilés |
| Contact sticky | Barre bottom sticky | Boutons contact fixés en bas de l'écran lors du scroll |
| Bouton "C'est ma fiche" | `ClaimButton` | Visible en bas de page ou dans les options |

---

## Écran 5 — Ma Vie de Quartier & Annonces

**Titre Stitch :** Ma Vie de Quartier & Annonces
**Dimensions :** 780×4658px
**Route cible :** (secondaire — non dans le MVP Phase 1)

### Notes
Cet écran représente une fonctionnalité "Phase 2" : annonces de quartier, demandes d'aide communautaire. Il contient :
- Section "Annonces récentes" avec cartes textuelles
- Section "Demandes d'aide" avec bouton "Poster"
- Filtres par catégorie d'annonces
- Non à implémenter en Phase 1

---

## Design System observé (Stitch → tokens CLAUDE.md)

| Propriété Stitch | Valeur | Token CLAUDE.md correspondant |
|-----------------|--------|-------------------------------|
| Couleur primaire | Bleu `#005bbf` / `#1a73e8` | `--color-primary: #1B6CA8` |
| Couleur accent | Or/ambre `#fbbc05` | `--color-accent: #F5A623` |
| Fond | `#f7f9ff` (quasi-blanc) | `--color-bg: #F8F9FB` |
| Surface cards | `#ffffff` | `--color-surface: #FFFFFF` |
| Border | `#c1c6d6` | `--color-border: #E2E8F0` |
| Texte | `#181c20` | `--color-text: #1A202C` |
| Texte secondaire | `#414754` | `--color-text-muted: #64748B` |
| Rayon boutons | `full` (pill) | `--radius-full: 9999px` |
| Rayon cards | `24px` | `--radius-lg: 20px` |
| Police titres | Plus Jakarta Sans | → Syne (CLAUDE.md) |
| Police corps | Be Vietnam Pro | → Epilogue (CLAUDE.md) |

---

## Flux de navigation complet

```
Accueil (/)
  ├── Catégorie → /providers?category=xxx
  ├── Explorer → /providers (vue carte/liste)
  │     ├── Marker/Card → ProviderSheet (bottom sheet)
  │     └── "Voir fiche complète" → /providers/[id]
  │           ├── "C'est ma fiche" → /claim
  │           │     ├── OTP vérifié + fiche trouvée → /dashboard
  │           │     └── OTP vérifié + aucune fiche → /providers/new
  │           ├── "Laisser un avis" → OTP requis → formulaire avis
  │           └── Boutons contact (Appeler, WhatsApp, Itinéraire)
  ├── FAB "+" → /providers/new
  └── Profil (BottomNav) → /dashboard (si auth) ou /claim
```

---

## Composants à créer par priorité (déduits des maquettes)

1. `BottomNav` — présent sur tous les écrans
2. `SearchBar` — écran Accueil
3. `CategoryGrid` / `CategoryChips` — Accueil + Providers
4. `ProviderCard` — Accueil + Providers list
5. `MapView` — Providers (écran 2)
6. `ProviderSheet` — Bottom sheet (écran 2 → clic marker)
7. `ProviderForm` — /providers/new
8. `OtpInput` — /claim
9. `StarRating` — ProviderCard + ProviderSheet
10. `BadgeVerified` — ProviderCard + ProviderSheet

---

## Détails UX issus de l'analyse HTML (enrichissement)

### Accueil
- Header : Avatar circulaire top-right + nom app + localisation
- La grille catégories est 2 colonnes sur mobile (peut aller jusqu'à 4 avec scroll horizontal)
- Le badge "RECOMMANDÉ" est en rouge/accent sur les cartes prestataires
- Les cartes prestataires en accueil : avatar circulaire, pas rectangle

### Carte interactive (`/providers`)
- Les chips de filtre sont **scrollables horizontalement** (pas de wrapping)
- Le chip actif a un fond coloré (couleur primaire)
- Chaque ProviderCard sous la carte affiche : tarif/heure, description courte (≤125 chars), bouton "Demander" pill-shaped
- Le bouton géolocalisation est en position fixe sur la carte (haut droite ou bas droite)
- La liste de prestataires est une **sheet remontante** depuis le bas, pas une page séparée

### Fiche prestataire (`/providers/[id]`)
- La photo prestataire est grande format (bannière ou plein-largeur)
- Le badge "Vérifié" est overlay sur la photo avec label texte
- Les 4 services sont en **grid 2×2** avec prix sur chaque carte
- Le temps de réponse ("15 min") est affiché comme métadonnée
- Les **boutons de contact sont sticky** en bas lors du scroll
- Le bouton "C'est ma fiche" est discret (non sticky), en pied de page

### Revendication (`/claim`)
- Flux en 3 étapes sur la même page (stepper)
- Étape 1 : Champ téléphone avec format international
- Étape 2 : 6 cases OTP individuelles + compteur 60s pour renvoyer
- Étape 3A (trouvé) : Résumé fiche + bouton "Confirmer"
- Étape 3B (non trouvé) : Message explicatif + bouton "Créer ma fiche"
