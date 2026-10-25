---
name: NearYou (GéoService)
description: Le bon artisan, à deux pas de chez vous. Annuaire géolocalisé, Bénin et Côte d'Ivoire.
colors:
  bleu-lagune: "oklch(0.505 0.124 246)"
  bleu-lagune-profond: "oklch(0.400 0.098 246)"
  bleu-lagune-voile: "oklch(0.955 0.022 240)"
  bleu-lagune-brume: "oklch(0.800 0.060 242)"
  ambre-epingle: "oklch(0.785 0.155 72)"
  ambre-ecrit: "oklch(0.520 0.120 60)"
  ambre-voile: "oklch(0.962 0.040 86)"
  sable-sol: "oklch(0.975 0.007 80)"
  sable-papier: "oklch(0.995 0.003 80)"
  sable-creux: "oklch(0.950 0.010 78)"
  sable-trait: "oklch(0.900 0.013 76)"
  encre: "oklch(0.235 0.020 250)"
  encre-douce: "oklch(0.500 0.020 70)"
  encre-claire: "oklch(0.530 0.016 70)"
  vert-dispo: "oklch(0.600 0.140 150)"
  vert-dispo-voile: "oklch(0.955 0.045 150)"
  vert-whatsapp: "oklch(0.530 0.128 152)"
  rouge-alerte: "oklch(0.575 0.195 27)"
typography:
  display:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.9rem + 1.8vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.5rem + 1.1vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.1rem + 0.3vw, 1.3rem)"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Epilogue, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.97rem + 0.15vw, 1.075rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Epilogue, system-ui, sans-serif"
    fontSize: "clamp(0.75rem, 0.72rem + 0.15vw, 0.8rem)"
    fontWeight: 500
    lineHeight: 1.4
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontWeight: 500
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  sm: "6px"
  md: "12px"
  lg: "20px"
  panel: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "56px"
components:
  button-contact-call:
    backgroundColor: "{colors.bleu-lagune}"
    textColor: "{colors.sable-papier}"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 12px"
  button-contact-whatsapp:
    backgroundColor: "{colors.vert-whatsapp}"
    textColor: "{colors.sable-papier}"
    rounded: "{rounded.full}"
    height: "48px"
  button-contact-itinerary:
    backgroundColor: "{colors.ambre-voile}"
    textColor: "{colors.ambre-ecrit}"
    rounded: "{rounded.full}"
    height: "48px"
  button-soft:
    backgroundColor: "{colors.sable-creux}"
    textColor: "{colors.encre}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 16px"
  button-soft-accent:
    backgroundColor: "{colors.ambre-epingle}"
    textColor: "{colors.encre}"
    rounded: "{rounded.full}"
    height: "40px"
    padding: "0 16px"
  chip:
    backgroundColor: "{colors.sable-papier}"
    textColor: "{colors.encre-douce}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.encre}"
    textColor: "{colors.sable-papier}"
    rounded: "{rounded.full}"
  map-chip:
    backgroundColor: "{colors.sable-papier}"
    textColor: "{colors.encre}"
    rounded: "{rounded.full}"
    height: "44px"
  search-field:
    backgroundColor: "{colors.sable-papier}"
    textColor: "{colors.encre}"
    rounded: "{rounded.full}"
    padding: "12px 40px 12px 44px"
  panel:
    backgroundColor: "{colors.sable-papier}"
    rounded: "{rounded.panel}"
    padding: "20px"
  provider-row:
    backgroundColor: "{colors.sable-papier}"
    rounded: "{rounded.lg}"
    padding: "12px"
  provider-row-selected:
    backgroundColor: "{colors.bleu-lagune-voile}"
---

# Design System: NearYou

## 1. Overview

**Creative North Star: "Le plan du quartier"**

NearYou se lit comme un plan qu'on consulte avec un voisin. Le sol est du sable chaud, l'eau est d'un bleu de lagune, et les épingles ambre disent où se trouve quelqu'un qui peut aider. Tout le reste s'efface derrière ces trois couleurs : l'interface est un plan précis, la chaleur vient de ce qu'on y montre.

Le système est **restreint** : des neutres teintés vers le sable, un bleu de marque, un ambre qui signale (une épingle, un appel à contribuer, l'itinéraire). La carte vectorielle est restylée avec cette même palette, elle n'est jamais une tuile OpenStreetMap brute. La densité est celle d'une app de carte : la carte d'abord, les résultats à côté (ordinateur) ou dans un panneau qu'on tire (téléphone), jamais l'écran mobile étiré sur 1440 px.

La scène qui décide du thème : quelqu'un debout dans une rue de Cotonou, en plein après-midi, sur un Android de milieu de gamme en 3G, qui cherche un plombier maintenant. D'où un thème **clair**, un fort contraste, des cibles tactiles de 44 px et des chiffres lisibles d'un coup d'œil. Le système rejette l'annuaire administratif froid, le SaaS bleu-violet interchangeable, le tableau de bord « gros chiffre, petite étiquette » et les tuiles de carte brutes.

**Key Characteristics:**
- Thème clair sur sable, contraste WCAG AA même en plein soleil.
- La carte est la surface principale ; tout le reste se pose dessus ou à côté.
- Chiffres (distances, notes, compteurs) en police à chasse fixe.
- À plat par défaut ; l'ombre seulement pour ce qui flotte.
- Mobile d'abord, avec une vraie mise en page à partir de 1024 px (rail de navigation à gauche).

## 2. Colors: La palette du plan

Sable pour le sol, bleu de lagune pour la marque, ambre pour ce qui signale.

### Primary
- **Bleu lagune** (oklch(0.505 0.124 246)) : la marque. Bouton Appeler, épingle sélectionnée, point « vous êtes ici », lien actif, anneau de focus. Jamais en grande surface.
- **Bleu lagune profond** (oklch(0.400 0.098 246)) : contour du tracé d'itinéraire, états appuyés.
- **Voile de lagune** (oklch(0.955 0.022 240)) : fond de l'élément actif (navigation, ligne de résultat sélectionnée).
- **Brume de lagune** (oklch(0.800 0.060 242)) : barres du graphique au repos, la barre survolée ou du jour passe en bleu lagune.

### Secondary
- **Ambre épingle** (oklch(0.785 0.155 72)) : épingles des prestataires sur la carte, bouton « Ajouter » de la navigation, bouton d'action pour contribuer. C'est le signal : rare et toujours porteur de sens.
- **Ambre écrit** (oklch(0.520 0.120 60)) : l'ambre en texte ou en icône sur fond clair (l'ambre épingle n'y est pas lisible) ; 5,1:1 sur le voile d'ambre.
- **Voile d'ambre** (oklch(0.962 0.040 86)) : fond du bouton Itinéraire, des initiales d'un prestataire sans photo.

### Tertiary
- **Vert disponible** (oklch(0.600 0.140 150)) et son voile (oklch(0.955 0.045 150)) : uniquement l'état « disponible » (point, bandeau du tableau de bord).
- **Vert WhatsApp** (oklch(0.530 0.128 152)) : uniquement le bouton WhatsApp, assombri pour qu'un texte clair y reste lisible (4,8:1).
- **Rouge alerte** (oklch(0.575 0.195 27)) : erreurs et suppression, rien d'autre.

### Neutral
- **Sol de sable** (oklch(0.975 0.007 80)) : fond de page.
- **Papier de sable** (oklch(0.995 0.003 80)) : surfaces posées (panneaux, champ de recherche, navigation). Remplace le blanc.
- **Sable creux** (oklch(0.950 0.010 78)) : surfaces en retrait (bouton discret, état vide, tuile de chiffre).
- **Trait de sable** (oklch(0.900 0.013 76)) : bordures et séparateurs, 1 px.
- **Encre** (oklch(0.235 0.020 250)) : texte principal, puce sélectionnée, étiquette d'une épingle.
- **Encre douce** (oklch(0.500 0.020 70)) : texte secondaire (contraste AA sur sable).
- **Encre claire** (oklch(0.530 0.016 70)) : le non essentiel (dates, mentions). Moins appuyée que l'encre douce, mais toujours à 4,5:1 sur tout fond sable : une date reste lisible au soleil.

### Named Rules
**The Sand Floor Rule.** Aucun noir ni blanc pur : tout neutre est teinté sable (chroma 0.003 à 0.02, teinte 70 à 80). Un `#fff` ou un `#000` dans le code est un défaut.

**The Amber Signal Rule.** L'ambre marque ce qui mérite d'être trouvé ou fait (une épingle, contribuer, y aller). S'il décore, il ment.

**The Map Is Branded Rule.** Les couleurs de la carte (`src/components/map/brand-map.ts`) sont ces mêmes jetons en hexadécimal ; MapLibre ne lit pas l'OKLCH. Un changement de palette se fait aux deux endroits.

## 3. Typography

**Display Font:** Syne (avec system-ui)
**Body Font:** Epilogue (avec system-ui)
**Label/Mono Font:** Geist Mono, pour les chiffres seulement

**Character:** Syne donne la voix : large, affirmée, un peu architecturale, pour les titres. Epilogue reste lisible et chaleureuse dans le texte courant. Geist Mono aligne les chiffres pour le côté « net et technique ».

### Hierarchy
- **Display** (700, clamp 2.25 à 3.5rem, interligne 1.05) : le titre de l'accueil, une fois par écran au plus.
- **Headline** (700, clamp 1.75 à 2.5rem, 1.15) : le nom du prestataire, « Bonjour, Prénom ».
- **Title** (700, clamp 1.15 à 1.3rem, 1.3) : titres de section (« Où le trouver », « Avis »).
- **Body** (400, clamp 1 à 1.075rem, 1.6) : texte courant, limité à 65ch.
- **Label** (500, 0.75 à 0.8rem) : navigation, mentions, légendes de graphique.
- **Numeric** (Geist Mono 500, chiffres tabulaires) : distances, notes, compteurs, crans de rayon.

### Named Rules
**The Numbers Are Measured Rule.** Toute valeur mesurée (« 821 m », « 4.5 », « 5 km », un compteur) passe en Geist Mono via la classe `.tabular`. Un chiffre en Epilogue au milieu d'une donnée est un oubli.

**The French Spacing Rule.** Espace insécable avant « ? », « : », « ! » dans les titres et la FAQ : un point d'interrogation seul en début de ligne est un défaut.

## 4. Elevation

Le système est **à plat par défaut**. Les surfaces se distinguent par leur teinte (sol de sable, papier, creux), pas par des ombres. L'ombre est réservée à ce qui **flotte au-dessus de la carte ou du contenu** : boutons posés sur la carte, panneau de résultats à tirer, aperçu « près de vous », carte de contact sur ordinateur, bulle d'information. Les ombres sont teintées sable, jamais noires.

### Shadow Vocabulary
- **Pose** (`box-shadow: 0 1px 2px oklch(0.30 0.03 60 / 0.06), 0 1px 3px oklch(0.30 0.03 60 / 0.06)`) : puces flottantes, champ de recherche.
- **Flotte** (`box-shadow: 0 4px 16px oklch(0.30 0.03 60 / 0.09)`) : boutons sur la carte, carte de contact, légende de l'aperçu.
- **Panneau** (`box-shadow: 0 -8px 30px oklch(0.30 0.03 60 / 0.12)`) : le panneau de résultats qui monte du bas.
- **Épingle** (`box-shadow: 0 4px 10px oklch(0.30 0.05 60 / 0.30)`) : les épingles, pour qu'elles se détachent du plan.

### Named Rules
**The Only Floats Cast Rule.** Une ombre signifie « ceci flotte au-dessus de la carte ou de la page ». Un panneau posé dans le flux n'en a pas ; s'il en a besoin pour se voir, c'est sa teinte qui est mauvaise.

## 5. Components

Des formes pleines, arrondies, faites pour le pouce : tactiles et franches, jamais bavardes.

### Buttons
- **Shape :** pilule (9999px), hauteur 48px pour le contact, 40px pour les actions secondaires.
- **Contact :** trois boutons côte à côte. Appeler en bleu lagune, WhatsApp en vert WhatsApp, tous deux en texte papier ; Itinéraire en voile d'ambre et ambre écrit. Sur téléphone, trois colonnes égales, toutes libellées (« Y aller » pour l'itinéraire) ; sur la carte de contact de l'ordinateur, Itinéraire prend sa propre ligne, suivi d'« Ouvrir dans Maps ».
- **Discret (`btn-soft`) :** sable creux, encre, pour « Voir la fiche complète », « Chercher ma fiche ».
- **Discret ambre (`btn-soft--accent`) :** ambre épingle et encre, pour contribuer (« Ajouter un prestataire », « Laisser le premier avis »).
- **Hover / Focus :** le contact se tasse légèrement à l'appui (scale 0.97) ; focus visible par un anneau bleu lagune de 2px, décalé de 2px.

### Chips
- **Filtres (catégories, crans de rayon) :** papier de sable, trait de sable, encre douce, 44px. Sélectionné : fond encre, texte papier. Sur la carte (téléphone), sans bordure mais avec l'ombre « pose ».
- **Métiers de l'accueil :** pastilles de 44px avec icône ambre écrit, qui passent à la ligne : aucun nom de métier coupé.

### Cards / Containers
- **Panneaux :** papier de sable sur sol de sable, arrondi 24px, padding 20px (28px sur ordinateur), sans ombre.
- **États vides :** sable creux, arrondi 16px, une phrase qui dit pourquoi c'est vide et une action. Un vide attendu (une fiche jeune sans avis) tient en une ligne et un bouton, sans bloc.
- **Jamais de carte dans une carte.** Les lignes de résultat sont des lignes (survol en sable creux, sélection en voile de lagune), pas des cartes.

### Inputs / Fields
- **Recherche :** pilule papier de sable, trait de sable, ombre « pose », loupe à gauche, effacer à droite.
- **Focus :** anneau bleu lagune posé sur la pilule entière (`:focus-within`), jamais retiré sans remplaçant.

### Navigation
- **Téléphone :** barre du bas de 64px (plus la zone sûre), quatre entrées ; l'actif a une pastille voile de lagune derrière l'icône. « Ajouter » est un rond ambre.
- **Ordinateur (≥ 1024px) :** rail vertical de 88px à gauche, logo en haut, « Ajouter » en bas. La place est réservée par les variables `--app-inset-left` et `--app-inset-bottom` ; tout élément fixe s'y cale.

### Fiche prestataire
- **En-tête :** initiale (la même lettre que l'épingle), nom, badge « Numéro vérifié » si revendiquée, métier, puis une ligne « 7,6 km de vous · quartier » (la distance seulement si l'usager s'est localisé). La disponibilité ne s'affiche que sur une fiche revendiquée, « selon le prestataire ».
- **Ordinateur :** la carte occupe toute la colonne de droite, sur la hauteur de l'écran ; la carte de contact est posée dessus, en bas.
- **Cibles :** 44px minimum partout, contrôles de la carte compris.

### Carte et épingles (signature)
- **Épingle prestataire :** goutte ambre de 32px, initiale en Syne encre ; sélectionnée, elle grossit (1.22) et passe en bleu lagune avec le nom en étiquette encre au-dessus.
- **Vous êtes ici :** point bleu lagune cerclé de papier, halo qui respire (coupé si mouvement réduit).
- **Vue 3D :** inclinée à 55° avec bâtiments en relief sur ordinateur et sur la fiche ; à plat par défaut sur téléphone ; bouton 3D / 2D toujours présent.
- **Panneau de résultats (téléphone) :** trois crans (résumé, moitié, plein écran), poignée à tirer ou à toucher, sortie en courbe exponentielle sans rebond.

## 6. Do's and Don'ts

### Do:
- **Do** poser chaque écran pour le téléphone **et** pour l'ordinateur dans le même lot : « chaque écran à sa taille ».
- **Do** donner à chaque absence un message et une action : « Pas encore d'avis » avec « Laisser le premier avis », jamais « 0.0 (0) ».
- **Do** utiliser les jetons (`var(--color-…)`) ; toute couleur nouvelle naît en OKLCH dans `globals.css`.
- **Do** passer les chiffres mesurés en `.tabular`.
- **Do** charger la carte seulement là où elle sert, et une seule fois par écran (`MediaOnly`), avec son repli.
- **Do** vérifier aux largeurs 390, 768 et 1440 px, `scrollWidth` compris.

### Don't:
- **Don't** étirer l'écran mobile sur 1440 px avec la navigation du bas sur ordinateur.
- **Don't** laisser un élément cassé ou en débordement, ni un « 0.0 (0) » à la place d'un état vide, ni une carte blanche.
- **Don't** faire un tableau de bord générique : un grand chiffre, une petite étiquette, des tuiles identiques.
- **Don't** poser des tuiles OpenStreetMap brutes telles quelles.
- **Don't** ressembler à l'annuaire administratif froid (pages jaunes) ni au SaaS bleu-violet interchangeable.
- **Don't** utiliser `#fff`, `#000`, ni une ombre `rgba(0,0,0,…)`.
- **Don't** mettre une bordure latérale colorée de plus de 1px, un texte en dégradé, ou du verre flouté décoratif.
- **Don't** animer une propriété de mise en page (hauteur, largeur) ; ni rebond, ni élastique.
- **Don't** ouvrir une modale quand un panneau ou un affichage sur place suffit.
