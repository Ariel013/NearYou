-- ===================================================
-- Migration 003 : coordonnées explicites dans les RPC
-- Raison : PostGIS GEOGRAPHY sérialisé en hex WKB côté
-- client Supabase → ST_X/ST_Y retournent des floats lisibles
-- ===================================================

-- ─── get_providers_near : recréation complète ─────
-- (DROP requis car le type de retour change)
DROP FUNCTION IF EXISTS get_providers_near(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT);

CREATE FUNCTION get_providers_near(
  user_lat        DOUBLE PRECISION,
  user_lng        DOUBLE PRECISION,
  radius_m        DOUBLE PRECISION,
  category_filter TEXT DEFAULT NULL,
  search_query    TEXT DEFAULT NULL
)
RETURNS TABLE (
  id               UUID,
  name             TEXT,
  contact_phone    TEXT,
  bio              TEXT,
  address_label    TEXT,
  zone_radius_km   INTEGER,
  available        BOOLEAN,
  verified_at      TIMESTAMPTZ,
  claimed_at       TIMESTAMPTZ,
  claimed_by_phone TEXT,
  avg_rating       NUMERIC,
  review_count     INTEGER,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  distance_km      DOUBLE PRECISION,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  categories       JSONB,
  cover_photo      JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.contact_phone,
    p.bio,
    p.address_label,
    p.zone_radius_km,
    p.available,
    p.verified_at,
    p.claimed_at,
    p.claimed_by_phone,
    p.avg_rating,
    p.review_count,
    p.created_at,
    p.updated_at,
    ST_Distance(p.location, ST_Point(user_lng, user_lat)::geography) / 1000 AS distance_km,
    ST_Y(p.location::geometry)::DOUBLE PRECISION                            AS lat,
    ST_X(p.location::geometry)::DOUBLE PRECISION                            AS lng,
    COALESCE(
      (
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'id',        c.id,
          'name',      c.name,
          'slug',      c.slug,
          'icon_name', c.icon_name,
          'parent_id', c.parent_id,
          'created_at',c.created_at
        ))
        FROM provider_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.provider_id = p.id
      ),
      '[]'::JSONB
    ) AS categories,
    (
      SELECT JSONB_BUILD_OBJECT(
        'id',          pp.id,
        'provider_id', pp.provider_id,
        'url',         pp.url,
        'caption',     pp.caption,
        'is_cover',    pp.is_cover,
        'created_at',  pp.created_at
      )
      FROM provider_photos pp
      WHERE pp.provider_id = p.id AND pp.is_cover = true
      LIMIT 1
    ) AS cover_photo
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
        SELECT 1 FROM provider_categories pc2
        JOIN categories c2 ON c2.id = pc2.category_id
        WHERE pc2.provider_id = p.id AND c2.slug = category_filter
      )
    )
    AND (
      search_query IS NULL
      OR p.name ILIKE '%' || search_query || '%'
      OR p.bio  ILIKE '%' || search_query || '%'
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- ─── get_provider_by_id : fiche complète avec coords ──
CREATE OR REPLACE FUNCTION get_provider_by_id(p_id UUID)
RETURNS TABLE (
  id               UUID,
  name             TEXT,
  contact_phone    TEXT,
  bio              TEXT,
  address_label    TEXT,
  zone_radius_km   INTEGER,
  available        BOOLEAN,
  verified_at      TIMESTAMPTZ,
  claimed_at       TIMESTAMPTZ,
  claimed_by_phone TEXT,
  avg_rating       NUMERIC,
  review_count     INTEGER,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  categories       JSONB,
  photos           JSONB,
  reviews          JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.contact_phone,
    p.bio,
    p.address_label,
    p.zone_radius_km,
    p.available,
    p.verified_at,
    p.claimed_at,
    p.claimed_by_phone,
    p.avg_rating,
    p.review_count,
    p.created_at,
    p.updated_at,
    ST_Y(p.location::geometry)::DOUBLE PRECISION AS lat,
    ST_X(p.location::geometry)::DOUBLE PRECISION AS lng,
    COALESCE(
      (
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'id',        c.id,
          'name',      c.name,
          'slug',      c.slug,
          'icon_name', c.icon_name,
          'parent_id', c.parent_id,
          'created_at',c.created_at
        ))
        FROM provider_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.provider_id = p.id
      ),
      '[]'::JSONB
    ) AS categories,
    COALESCE(
      (
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'id',          pp.id,
          'provider_id', pp.provider_id,
          'url',         pp.url,
          'caption',     pp.caption,
          'is_cover',    pp.is_cover,
          'created_at',  pp.created_at
        ) ORDER BY pp.is_cover DESC, pp.created_at ASC)
        FROM provider_photos pp
        WHERE pp.provider_id = p.id
      ),
      '[]'::JSONB
    ) AS photos,
    COALESCE(
      (
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'id',             r.id,
          'provider_id',    r.provider_id,
          'reviewer_phone', r.reviewer_phone,
          'rating',         r.rating,
          'comment',        r.comment,
          'created_at',     r.created_at
        ) ORDER BY r.created_at DESC)
        FROM reviews r
        WHERE r.provider_id = p.id
      ),
      '[]'::JSONB
    ) AS reviews
  FROM providers p
  WHERE p.id = p_id;
END;
$$ LANGUAGE plpgsql;
