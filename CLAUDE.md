# CLAUDE.md — Cerveau du projet GéoService Proximité
@AGENTS.md

> Ce fichier est la **référence absolue** du projet. Claude Code doit le lire en entier avant toute action et s'y référer à chaque décision technique, de nommage, de design ou d'architecture. Il prime sur toute autre source.

---

## 1. Vision du projet

**GéoService Proximité** est une application web/mobile qui connecte les utilisateurs avec des prestataires de services locaux (menuisiers, plombiers, électriciens, agents de ménage, coursiers, etc.) via géolocalisation.

### Principe fondamental
- N'importe qui peut **créer une fiche** pour un prestataire (modèle communautaire)
- Le prestataire peut **revendiquer sa fiche** via OTP SMS sur son numéro de téléphone
- L'utilisateur cherche, trouve, contacte — **sans compte obligatoire**

### Utilisateurs cibles
- **Chercheurs de service** : particuliers, entreprises locales (Bénin, Côte d'Ivoire, Afrique de l'Ouest)
- **Prestataires** : travailleurs manuels et de services, souvent peu digitalisés
- **Contributeurs communautaires** : toute personne qui connaît un bon prestataire local

---

## 2. Stack technique (non négociable)

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | **Next.js 15** (App Router) | SSR pour SEO fiches, meilleur support Claude Code |
| Langage | **TypeScript strict** | Typage complet, zéro `any` sauf exception justifiée |
| Styles | **Tailwind CSS v4** + CSS custom properties | Utility-first + token system |
| Composants UI | **shadcn/ui** (Radix UI) | Accessible, headless, personnalisable |
| Cartes | **Leaflet.js** + **OpenStreetMap** | 100% gratuit, bonne couverture Afrique de l'Ouest |
| Base de données | **Supabase** (PostgreSQL + PostGIS) | Auth OTP, Realtime, Storage, géospatial |
| ORM | **Prisma** ou **Supabase client direct** | À trancher selon complexité des requêtes |
| SMS OTP | **Africa's Talking** | Meilleurs tarifs Afrique de l'Ouest |
| Auth | **Supabase Auth** (Phone OTP uniquement) | Pas de email/password |
| Icônes | **Lucide React** | Cohérence, tree-shakeable |
| Animations | **Framer Motion** | Transitions fluides, respect reduced-motion |
| State | **Zustand** | Léger, simple, suffisant |
| Forms | **React Hook Form** + **Zod** | Validation typée côté client |
| Hébergement | **Vercel** (front) + **Supabase** (back) | Free tier suffisant pour MVP |

---

## 3. Architecture des dossiers

```
geoservice/
├── CLAUDE.md                    ← CE FICHIER — toujours lire en premier
├── .env.local                   ← Variables d'environnement (jamais committé)
├── .env.example                 ← Template des variables requises
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── icons/                   ← Icônes SVG des catégories de services
│   └── images/
│
├── src/
│   ├── app/                     ← App Router Next.js
│   │   ├── layout.tsx           ← Root layout (fonts, providers)
│   │   ├── page.tsx             ← Page d'accueil / recherche
│   │   ├── providers/
│   │   │   ├── page.tsx         ← Liste/carte des prestataires
│   │   │   └── [id]/
│   │   │       └── page.tsx     ← Fiche prestataire (SSR pour SEO)
│   │   ├── claim/
│   │   │   └── page.tsx         ← Flux revendication / création de fiche
│   │   ├── dashboard/
│   │   │   └── page.tsx         ← Tableau de bord prestataire (après claim)
│   │   └── api/
│   │       ├── otp/
│   │       │   ├── send/route.ts
│   │       │   └── verify/route.ts
│   │       └── providers/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui components (auto-générés)
│   │   ├── map/
│   │   │   ├── MapView.tsx      ← Composant carte principal
│   │   │   ├── ProviderMarker.tsx
│   │   │   └── LocationPicker.tsx  ← Sélecteur de position (création fiche)
│   │   ├── providers/
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── ProviderList.tsx
│   │   │   └── ProviderSheet.tsx   ← Bottom sheet fiche prestataire
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── CategoryGrid.tsx
│   │   ├── claim/
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── OtpInput.tsx
│   │   │   └── ClaimResult.tsx     ← Affiche résultat : fiche trouvée ou création
│   │   ├── forms/
│   │   │   └── ProviderForm.tsx    ← Formulaire création/édition fiche
│   │   └── shared/
│   │       ├── StarRating.tsx
│   │       ├── BadgeVerified.tsx
│   │       └── BottomNav.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        ← Supabase browser client
│   │   │   ├── server.ts        ← Supabase server client (RSC)
│   │   │   └── types.ts         ← Types générés depuis le schéma DB
│   │   ├── africa-talking.ts    ← Client SMS OTP
│   │   ├── geo.ts               ← Utilitaires géospatiales (distance, format)
│   │   └── validations.ts       ← Schémas Zod partagés
│   │
│   ├── hooks/
│   │   ├── useGeolocation.ts    ← Hook position GPS utilisateur
│   │   ├── useProviders.ts      ← Hook liste prestataires avec filtres
│   │   └── useAuth.ts           ← Hook session OTP
│   │
│   ├── store/
│   │   ├── useSearchStore.ts    ← Filtres, position, catégorie active
│   │   └── useAuthStore.ts      ← Session prestataire connecté
│   │
│   └── types/
│       └── index.ts             ← Types métier globaux
```

---

## 4. Modèle de données (Supabase / PostgreSQL + PostGIS)

### Tables

```sql
-- Extension géospatiale (à activer en premier)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Catégories de services
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  icon_name   TEXT NOT NULL,          -- nom icône Lucide
  parent_id   UUID REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Fiches prestataires
CREATE TABLE providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,       -- clé de matching pour le claim
  bio             TEXT,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS
  address_label   TEXT,               -- ex: "Quartier Gbèdjromèdji, Cotonou"
  zone_radius_km  INTEGER DEFAULT 5,
  available       BOOLEAN DEFAULT true,
  verified_at     TIMESTAMPTZ,        -- null = non vérifié
  claimed_at      TIMESTAMPTZ,        -- null = non revendiquée
  claimed_by_phone TEXT,              -- numéro du propriétaire
  avg_rating      NUMERIC(2,1) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index géospatial (performance critique)
CREATE INDEX providers_location_idx ON providers USING GIST(location);

-- Liaison prestataires ↔ catégories (N:M)
CREATE TABLE provider_categories (
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, category_id)
);

-- Photos portfolio
CREATE TABLE provider_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  caption      TEXT,
  is_cover     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Avis et notes
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  reviewer_phone TEXT NOT NULL,       -- OTP vérifié pour poster
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, reviewer_phone) -- 1 avis par numéro par prestataire
);

-- OTP temporaires (claim + avis)
CREATE TABLE otp_claims (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  provider_id  UUID REFERENCES providers(id),  -- null si nouvel utilisateur
  code         TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('claim', 'review', 'login')),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Signalements
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  review_id    UUID REFERENCES reviews(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (reason IN (
    'fiche_incorrecte', 'prestataire_inexistant',
    'avis_abusif', 'contenu_inapproprie', 'doublon'
  )),
  details      TEXT,
  reporter_ip  TEXT,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Tracking des mises en contact (analytics)
CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('call', 'whatsapp', 'itinerary')),
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### Trigger : recalcul automatique avg_rating

```sql
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET
    avg_rating   = (SELECT AVG(rating) FROM reviews WHERE provider_id = NEW.provider_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id),
    updated_at   = now()
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();
```

### Requête géospatiale principale

```sql
-- Prestataires dans un rayon de X km autour d'un point
SELECT
  p.*,
  ST_Distance(p.location, ST_Point($lng, $lat)::geography) / 1000 AS distance_km
FROM providers p
WHERE ST_DWithin(
  p.location,
  ST_Point($lng, $lat)::geography,
  $radius_meters
)
ORDER BY distance_km ASC;
```

### Row Level Security (RLS)

```sql
-- Lecture publique sur les fiches
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_public_read" ON providers FOR SELECT USING (true);

-- Modification uniquement par le propriétaire (vérifié par phone dans session)
CREATE POLICY "providers_owner_update" ON providers FOR UPDATE
USING (claimed_by_phone = auth.jwt() ->> 'phone');
```

---

## 5. Flux utilisateur — détail complet

### Flux A : Chercheur de service
1. **Accueil** → Grille de catégories + barre de recherche
2. **Géolocalisation** → Demande permission GPS (fallback : saisie adresse manuelle)
3. **Résultats** → Vue carte + vue liste switchable, tri par distance / note / disponibilité
4. **Fiche prestataire** → Photo, bio, catégories, note, avis, boutons contact
5. **Contact** → Bouton Appeler (`tel:`), WhatsApp (`wa.me/`), Itinéraire (lien OSM)
6. **Avis** → OTP SMS requis, 1 avis par numéro par prestataire

### Flux B : Création de fiche (contributeur)
1. Bouton "Ajouter un prestataire" accessible sans compte
2. Formulaire : nom, numéro, catégorie(s), description, position sur carte (drag du marker)
3. Validation Zod côté client + serveur
4. Fiche créée en statut `claimed_at = null`

### Flux C : Revendication (prestataire)
1. Bouton "C'est ma fiche" sur n'importe quelle fiche
2. Saisie du numéro → OTP envoyé via Africa's Talking
3. Validation OTP → recherche `WHERE contact_phone = numéro`
   - **Trouvé** → `claimed_at = now()`, `claimed_by_phone = numéro`, session JWT créée
   - **Non trouvé** → proposer de créer sa propre fiche (numéro déjà vérifié)
4. Accès au dashboard prestataire

### Gestion des doublons de fiche
- Détection automatique : même `contact_phone` → bloquer la création, proposer le claim
- Bouton "Signaler un doublon" sur chaque fiche
- Admin merge via dashboard back-office

---

## 6. Système de design

### Identité visuelle
- **Nom affiché** : GéoService
- **Tagline** : "Le bon artisan, à deux pas de chez vous"
- **Ton** : Chaleureux, de proximité, accessible, africain moderne
- **Device cible** : Mobile first (320px → 390px → 768px → 1280px)

### Palette de couleurs

```css
:root {
  /* Brand */
  --color-primary:       #1B6CA8;   /* Bleu confiance */
  --color-primary-light: #E8F4FD;
  --color-primary-dark:  #0D4E7A;
  --color-accent:        #F5A623;   /* Ambre chaud — proximité, soleil */
  --color-accent-light:  #FEF3D7;

  /* Neutrals */
  --color-bg:            #F8F9FB;
  --color-surface:       #FFFFFF;
  --color-border:        #E2E8F0;
  --color-text:          #1A202C;
  --color-text-muted:    #64748B;
  --color-text-light:    #94A3B8;

  /* Semantic */
  --color-success:       #22C55E;
  --color-success-light: #DCFCE7;
  --color-warning:       #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-error:         #EF4444;
  --color-error-light:   #FEE2E2;

  /* Spacing */
  --space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
  --space-4: 1rem;     --space-6: 1.5rem;   --space-8: 2rem;
  --space-12: 3rem;    --space-16: 4rem;    --space-24: 6rem;

  /* Radii */
  --radius-sm: 6px;  --radius-md: 12px;
  --radius-lg: 20px; --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.14);

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
}
```

### Typographie

```css
/* Polices : Syne (titres) + Epilogue (corps) */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Epilogue:wght@400;500;600&display=swap');

:root {
  --font-display: 'Syne', sans-serif;
  --font-body:    'Epilogue', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  --text-xs:   clamp(0.7rem,  0.65rem + 0.25vw, 0.8rem);
  --text-sm:   clamp(0.85rem, 0.8rem  + 0.25vw, 0.95rem);
  --text-base: clamp(1rem,    0.95rem + 0.25vw, 1.1rem);
  --text-lg:   clamp(1.15rem, 1.1rem  + 0.5vw,  1.3rem);
  --text-xl:   clamp(1.35rem, 1.2rem  + 0.75vw, 1.75rem);
  --text-2xl:  clamp(1.75rem, 1.5rem  + 1.25vw, 2.5rem);
  --text-3xl:  clamp(2.25rem, 2rem    + 2vw,    3.5rem);
}
```

### Composants — règles visuelles

| Composant | Règle |
|-----------|-------|
| `ProviderCard` | Ombre `shadow-md`, hover `translateY(-2px)`, badge disponibilité coloré |
| `StarRating` | Étoiles ambre `--color-accent`, afficher le score numérique à côté |
| `BadgeVerified` | Fond `--color-primary-light`, texte `--color-primary`, icône shield |
| `BottomNav` | Fond blanc, border-top `--color-border`, icônes Lucide, label sous icône |
| `OtpInput` | 6 cases séparées, focus auto-avance, paste intelligent |
| `MapView` | Tiles OpenStreetMap, marker custom SVG couleur `--color-primary` |
| `LocationPicker` | Marker draggable, coordonnées affichées en temps réel |

---

## 7. Conventions de nommage (non négociables)

### Fichiers & dossiers
- Composants React : `PascalCase.tsx` → `ProviderCard.tsx`
- Pages Next.js : `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Hooks : `camelCase` préfixé `use` → `useGeolocation.ts`
- Utilitaires : `camelCase` → `geo.ts`, `formatPhone.ts`
- Types : `PascalCase` → `Provider`, `Category`, `Review`
- Constantes : `SCREAMING_SNAKE_CASE` → `MAX_RADIUS_KM`
- API routes : `kebab-case` → `/api/otp/send`

### Variables TypeScript
```typescript
// Types métier
type Provider = { ... }
type Category = { ... }
type Review   = { ... }
type OtpPurpose = 'claim' | 'review' | 'login'

// Props de composants : suffixe Props
type ProviderCardProps = { provider: Provider; onSelect?: (id: string) => void }

// Réponses API : préfixe Api
type ApiResponse<T> = { data: T | null; error: string | null }

// Variables d'état : noms descriptifs
const [isLoading, setIsLoading] = useState(false)
const [providers, setProviders] = useState<Provider[]>([])
const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
```

### Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=

AFRICA_TALKING_API_KEY=
AFRICA_TALKING_USERNAME=

NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_DEFAULT_LAT=6.3659   # Cotonou
NEXT_PUBLIC_DEFAULT_LNG=2.4183
NEXT_PUBLIC_DEFAULT_RADIUS_KM=5
```

---

## 8. Règles de qualité du code

1. **TypeScript strict** — `strict: true` dans `tsconfig.json`, zéro `any` non justifié
2. **Pas de secret côté client** — toutes les clés sensibles dans les routes API server-side
3. **Validation double** — Zod côté client ET côté serveur (route handler)
4. **Gestion d'erreur explicite** — pas de `try/catch` vide, toujours logguer et retourner une `ApiResponse`
5. **Accessibilité** — WCAG 2.1 AA minimum : labels ARIA, focus visible, contraste suffisant
6. **Mobile first** — tester mentalement à 320px avant d'ajouter des breakpoints supérieurs
7. **Pas de `useEffect` pour les data fetching** — utiliser les Server Components ou SWR/React Query
8. **Images** — toujours `width` + `height` + `alt`, `loading="lazy"` hors-fold
9. **Commits** — format Conventional Commits : `feat:`, `fix:`, `chore:`, `docs:`

---

## 9. Catégories de services (données initiales)

```typescript
const CATEGORIES = [
  { slug: 'menuiserie',      name: 'Menuiserie',       icon_name: 'Hammer' },
  { slug: 'plomberie',       name: 'Plomberie',        icon_name: 'Wrench' },
  { slug: 'electricite',     name: 'Électricité',      icon_name: 'Zap' },
  { slug: 'menage',          name: 'Ménage',           icon_name: 'Sparkles' },
  { slug: 'maconnerie',      name: 'Maçonnerie',       icon_name: 'Building' },
  { slug: 'peinture',        name: 'Peinture',         icon_name: 'Paintbrush' },
  { slug: 'mecanique',       name: 'Mécanique',        icon_name: 'Settings' },
  { slug: 'informatique',    name: 'Informatique',     icon_name: 'Monitor' },
  { slug: 'couture',         name: 'Couture',          icon_name: 'Scissors' },
  { slug: 'coiffure',        name: 'Coiffure',         icon_name: 'User' },
  { slug: 'jardinage',       name: 'Jardinage',        icon_name: 'Leaf' },
  { slug: 'coursier',        name: 'Coursier',         icon_name: 'Bike' },
  { slug: 'climatisation',   name: 'Climatisation',    icon_name: 'Wind' },
  { slug: 'securite',        name: 'Sécurité',         icon_name: 'Shield' },
  { slug: 'autre',           name: 'Autre',            icon_name: 'MoreHorizontal' },
]
```

---

## 10. Écrans à implémenter (par priorité)

### MVP — Phase 1
1. **Accueil** (`/`) — Grille catégories + barre recherche + bouton géolocalisation
2. **Carte + Liste** (`/providers`) — Leaflet map + liste switchable, filtres
3. **Fiche prestataire** (`/providers/[id]`) — SSR, photo, infos, avis, boutons contact
4. **Claim flow** (`/claim`) — Saisie numéro → OTP → résultat (fiche trouvée ou création)
5. **Créer une fiche** (`/providers/new`) — Formulaire + LocationPicker
6. **Dashboard prestataire** (`/dashboard`) — Modifier fiche, voir avis, toggle disponibilité

### Post-MVP — Phase 2
7. **Profil avis** — Liste avis reçus, réponse prestataire
8. **Admin** (`/admin`) — Modération signalements, gestion doublons
9. **Recherche textuelle** — Full-text search sur nom + bio + catégorie

---

## 11. Checklist avant tout commit

- [ ] Schéma Supabase appliqué et migrations créées
- [ ] Variables `.env.example` à jour
- [ ] Aucune clé API hardcodée dans le code
- [ ] Composants testés à 320px (mobile S) et 390px (mobile standard)
- [ ] Tous les boutons ont un `aria-label` si icon-only
- [ ] Les formulaires ont des messages d'erreur en français
- [ ] Les routes API valident avec Zod avant toute requête DB
- [ ] Le trigger `update_provider_rating` est actif en base
- [ ] L'index PostGIS `providers_location_idx` est créé
- [ ] Le RLS est activé sur toutes les tables Supabase

---

## 12. Signal de fin de tâche

Quand Claude Code a terminé une phase ou l'ensemble du travail demandé, il doit :
1. Afficher dans le terminal : `✅ PHASE [N] TERMINÉE — [description courte]`
2. Lister les fichiers créés/modifiés
3. Lister les actions manuelles restantes (ex : créer le projet Supabase, activer Africa's Talking)
4. Poser une seule question si un choix bloquant reste à faire

---

*Dernière mise à jour : Mai 2026 — Version 1.0.0*