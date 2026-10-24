# Conventions de code — GéoService

> *À quoi doit ressembler le code que j'écris ?* Repris de l'ancien `CLAUDE.md`
> (2026-10-22). Une convention nouvelle s'ajoute ici **dans la tâche qui la
> fait apparaître**.

## Langue

Français pour les docs, les commentaires, les messages d'erreur affichés et le
vocabulaire du domaine. Identifiants de code en anglais là où le code existant
l'est déjà (`Provider`, `contact_phone`…) : ne pas mélanger dans un même
module.

## Nommage

- Composants React : `PascalCase.tsx` (`ProviderCard.tsx`).
- Pages Next.js : `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
- Hooks : `useXxx.ts` (`useGeolocation.ts`). Utilitaires : `camelCase.ts`.
- Types : `PascalCase` (`Provider`, `Category`, `Review`) ; props suffixées
  `Props` (`ProviderCardProps`).
- Constantes : `SCREAMING_SNAKE_CASE` (`MAX_RADIUS_KM`).
- Routes API : `kebab-case` (`/api/otp/send`).
- Réponses API : `ApiResponse<T> = { data: T | null; error: string | null }`.
- État : noms descriptifs (`isLoading`, `selectedProvider`).

## Qualité

1. **TypeScript strict**, zéro `any` non justifié.
2. **Aucun secret côté client** : les clés sensibles restent dans les routes
   API. Seules les variables `NEXT_PUBLIC_*` atteignent le navigateur.
3. **Validation double** : Zod côté client **et** dans le route handler, avant
   toute requête en base.
4. **Erreurs explicites** : pas de `catch` vide ; logguer avec un préfixe
   `[route METHOD]` et renvoyer une `ApiResponse` avec un message en français.
5. **Une route API ne renvoie que ce que son appelant a le droit de voir** :
   pas de `select('*')` renvoyé tel quel au public quand la table contient des
   données personnelles (voir `docs/architecture.md` §4 et §6).
6. **Accessibilité WCAG 2.1 AA** : labels ARIA, `aria-label` sur tout bouton
   icône seule, focus visible, contraste suffisant.
7. **Mobile first** : penser 320 px avant d'ajouter des breakpoints.
8. **Pas de `useEffect` pour charger des données** : Server Components en
   priorité.
9. **Images** : `width`, `height`, `alt`, `loading="lazy"` hors de l'écran.
10. **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`…) — détail
    dans `docs/workflow-git.md`.

## Système de design

Les jetons vivent dans `src/app/globals.css` — c'est la source ; ne pas les
redéfinir ailleurs.

- **Couleurs** : primaire bleu confiance `#1B6CA8` (clair `#E8F4FD`, foncé
  `#0D4E7A`), accent ambre `#F5A623` (clair `#FEF3D7`) ; neutres fond
  `#F8F9FB`, surface blanche, bordure `#E2E8F0`, texte `#1A202C` / atténué
  `#64748B` ; sémantiques succès `#22C55E`, alerte `#F59E0B`, erreur `#EF4444`.
- **Typographie** : Syne (titres, `--font-display`) + Epilogue (corps,
  `--font-body`), chargées par `next/font` ; tailles fluides en `clamp()`.
- **Rayons** 6 / 12 / 20 px / pilule ; **ombres** sm / md / lg ;
  **transitions** `cubic-bezier(0.16, 1, 0.3, 1)`, 150 / 250 ms, respect de
  `prefers-reduced-motion`.

| Composant | Règle |
|---|---|
| `ProviderCard` | ombre md, survol `translateY(-2px)`, badge de disponibilité coloré |
| `StarRating` | étoiles ambre, score numérique à côté |
| `BadgeVerified` | fond primaire clair, texte primaire, icône bouclier |
| `BottomNav` | fond blanc, bordure haute, icônes Lucide avec libellé dessous |
| `OtpInput` | 6 cases, avance automatique, collage intelligent |
| `MapView` | tuiles OSM, marker SVG couleur primaire |
| `LocationPicker` | marker déplaçable, coordonnées affichées en direct |

## Catégories

Les 15 catégories (slug, nom, icône Lucide) sont dans
`supabase/migrations/002_seed_categories.sql` — c'est la source.
