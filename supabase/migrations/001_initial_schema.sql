-- ===================================================
-- GéoService Proximité — Schéma initial
-- ===================================================

-- Extension géospatiale (obligatoire en premier)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Tables ─────────────────────────────────────────

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  icon_name   TEXT NOT NULL,
  parent_id   UUID REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  bio             TEXT,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  address_label   TEXT,
  zone_radius_km  INTEGER DEFAULT 5,
  available       BOOLEAN DEFAULT true,
  verified_at     TIMESTAMPTZ,
  claimed_at      TIMESTAMPTZ,
  claimed_by_phone TEXT,
  avg_rating      NUMERIC(2,1) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index géospatial critique pour les requêtes de proximité
CREATE INDEX providers_location_idx ON providers USING GIST(location);

CREATE TABLE provider_categories (
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, category_id)
);

CREATE TABLE provider_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  caption      TEXT,
  is_cover     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    UUID REFERENCES providers(id) ON DELETE CASCADE,
  reviewer_phone TEXT NOT NULL,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, reviewer_phone)
);

CREATE TABLE otp_claims (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  provider_id  UUID REFERENCES providers(id),
  code         TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('claim', 'review', 'login')),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID REFERENCES providers(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('call', 'whatsapp', 'itinerary')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Trigger : mise à jour automatique de avg_rating ──

CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET
    avg_rating   = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id)), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id)),
    updated_at   = now()
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ─── Fonction RPC : recherche géospatiale ─────────────

CREATE OR REPLACE FUNCTION get_providers_near(
  user_lat       DOUBLE PRECISION,
  user_lng       DOUBLE PRECISION,
  radius_m       DOUBLE PRECISION,
  category_filter TEXT DEFAULT NULL,
  search_query    TEXT DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  contact_phone   TEXT,
  bio             TEXT,
  location        GEOGRAPHY,
  address_label   TEXT,
  zone_radius_km  INTEGER,
  available       BOOLEAN,
  verified_at     TIMESTAMPTZ,
  claimed_at      TIMESTAMPTZ,
  claimed_by_phone TEXT,
  avg_rating      NUMERIC,
  review_count    INTEGER,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  distance_km     DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.contact_phone, p.bio, p.location, p.address_label,
    p.zone_radius_km, p.available, p.verified_at, p.claimed_at,
    p.claimed_by_phone, p.avg_rating, p.review_count, p.created_at, p.updated_at,
    ST_Distance(p.location, ST_Point(user_lng, user_lat)::geography) / 1000 AS distance_km
  FROM providers p
  WHERE
    ST_DWithin(
      p.location,
      ST_Point(user_lng, user_lat)::geography,
      radius_m
    )
    AND (
      category_filter IS NULL
      OR EXISTS (
        SELECT 1 FROM provider_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.provider_id = p.id AND c.slug = category_filter
      )
    )
    AND (
      search_query IS NULL
      OR p.name ILIKE '%' || search_query || '%'
      OR p.bio ILIKE '%' || search_query || '%'
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- ─── Row Level Security ────────────────────────────────

ALTER TABLE providers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_photos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_claims       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "providers_public_read"          ON providers       FOR SELECT USING (true);
CREATE POLICY "categories_public_read"         ON categories      FOR SELECT USING (true);
CREATE POLICY "provider_categories_public_read" ON provider_categories FOR SELECT USING (true);
CREATE POLICY "provider_photos_public_read"    ON provider_photos  FOR SELECT USING (true);
CREATE POLICY "reviews_public_read"            ON reviews         FOR SELECT USING (true);

-- Insertion publique (service role pour API routes)
CREATE POLICY "providers_service_insert"       ON providers       FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_service_insert"         ON reviews         FOR INSERT WITH CHECK (true);
CREATE POLICY "otp_claims_service_all"         ON otp_claims      FOR ALL    USING (true);
CREATE POLICY "contacts_service_insert"        ON contacts        FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_service_insert"         ON reports         FOR INSERT WITH CHECK (true);

-- Mise à jour par propriétaire
CREATE POLICY "providers_owner_update" ON providers FOR UPDATE
  USING (claimed_by_phone = current_setting('request.headers', true)::json->>'x-provider-phone');
