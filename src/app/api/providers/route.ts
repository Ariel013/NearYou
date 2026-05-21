import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { parseWkbPoint } from "@/lib/geo";
import type { ApiResponse, ProviderWithDistance } from "@/types";

// ─── GET — Recherche géospatiale ───────────────────────────────────────────

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().min(0.1).max(50).default(5),
  category_slug: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["distance", "rating", "availability"]).default("distance"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Paramètres invalides" },
      { status: 400 }
    );
  }

  const { lat, lng, radius_km, category_slug, q, sort } = parsed.data;
  const radiusMeters = radius_km * 1000;

  try {
    const supabase = await createServiceClient();

    const { data: providers, error } = await supabase.rpc("get_providers_near", {
      user_lat: lat,
      user_lng: lng,
      radius_m: radiusMeters,
      category_filter: category_slug ?? null,
      search_query: q ?? null,
    });

    if (error) throw error;

    // Normalisation : avant migration 003, le RPC renvoie location (hex WKB) sans lat/lng.
    // Après migration 003, lat/lng et categories/cover_photo sont des champs explicites.
    // On gère les deux cas.
    type RawRow = Record<string, unknown>;
    let result: ProviderWithDistance[] = (providers ?? []).map((p: RawRow) => {
      const coords = parseWkbPoint(p.location);
      return {
        ...(p as unknown as ProviderWithDistance),
        lat: typeof p.lat === "number" ? p.lat : (coords?.lat ?? 0),
        lng: typeof p.lng === "number" ? p.lng : (coords?.lng ?? 0),
        categories: Array.isArray(p.categories) ? p.categories : [],
        cover_photo: (p.cover_photo as ProviderWithDistance["cover_photo"]) ?? null,
      };
    });

    if (sort === "rating") {
      result = result.sort((a, b) => b.avg_rating - a.avg_rating);
    } else if (sort === "availability") {
      result = result.sort((a, b) => Number(b.available) - Number(a.available));
    }

    return NextResponse.json<ApiResponse<ProviderWithDistance[]>>({
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("[providers GET]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de la recherche de prestataires" },
      { status: 500 }
    );
  }
}

// ─── POST — Création d'un prestataire ──────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2).max(100),
  contact_phone: z.string().min(8).max(20),
  bio: z.string().max(500).optional(),
  address_label: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zone_radius_km: z.number().int().min(1).max(100).default(5),
  available: z.boolean().default(true),
  category_slugs: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { lat, lng, category_slugs, ...fields } = parsed.data;

  try {
    const supabase = await createServiceClient();

    // Vérification doublon par numéro de téléphone
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .eq("contact_phone", fields.contact_phone)
      .single();

    if (existing) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Un prestataire avec ce numéro existe déjà. Utilisez la fonction de revendication." },
        { status: 409 }
      );
    }

    // Résolution slugs → UUIDs catégories
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, slug")
      .in("slug", category_slugs);

    if (catError) throw catError;

    const categoryIds = (categories ?? []).map((c: { id: string }) => c.id);
    if (!categoryIds.length) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Aucune catégorie valide sélectionnée" },
        { status: 400 }
      );
    }

    // Création du prestataire avec localisation PostGIS
    const { data: provider, error: insertError } = await supabase
      .from("providers")
      .insert({
        ...fields,
        location: `POINT(${lng} ${lat})`,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Association des catégories
    const categoryLinks = categoryIds.map((category_id: string) => ({
      provider_id: provider.id,
      category_id,
    }));

    const { error: linkError } = await supabase
      .from("provider_categories")
      .insert(categoryLinks);

    if (linkError) throw linkError;

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id: provider.id }, error: null },
      { status: 201 }
    );
  } catch (err) {
    console.error("[providers POST]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de la création du prestataire" },
      { status: 500 }
    );
  }
}
