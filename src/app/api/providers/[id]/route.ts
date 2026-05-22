import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { parseWkbPoint } from "@/lib/geo";
import type { ApiResponse, ProviderFull } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServiceClient();

    const { data: provider, error } = await supabase
      .from("providers")
      .select(`*, provider_categories(category_id, categories(*)), provider_photos(*), reviews(*)`)
      .eq("id", id)
      .single();

    if (error || !provider) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Prestataire introuvable" },
        { status: 404 }
      );
    }

    // Supabase retourne GEOGRAPHY en hex WKB — parseWkbPoint le décode en {lat,lng}
    const coords = parseWkbPoint(provider.location);
    const lat = coords?.lat ?? 0;
    const lng = coords?.lng ?? 0;

    const result: ProviderFull = {
      id:               provider.id,
      name:             provider.name,
      contact_phone:    provider.contact_phone,
      bio:              provider.bio,
      address_label:    provider.address_label,
      zone_radius_km:   provider.zone_radius_km,
      available:        provider.available,
      verified_at:      provider.verified_at,
      claimed_at:       provider.claimed_at,
      claimed_by_phone: provider.claimed_by_phone,
      avg_rating:       provider.avg_rating,
      review_count:     provider.review_count,
      disabled_at:      provider.disabled_at ?? null,
      created_at:       provider.created_at,
      updated_at:       provider.updated_at,
      lat,
      lng,
      categories: provider.provider_categories.map(
        (pc: { categories: unknown }) => pc.categories
      ),
      photos:   provider.provider_photos,
      reviews:  provider.reviews,
    };

    return NextResponse.json<ApiResponse<ProviderFull>>({
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("[providers/[id] GET]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  address_label: z.string().max(200).optional(),
  zone_radius_km: z.number().int().min(1).max(100).optional(),
  available: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceClient();

    const { data: existing } = await supabase
      .from("providers")
      .select("claimed_by_phone")
      .eq("id", id)
      .single();

    const authHeader = req.headers.get("x-provider-phone");
    if (!existing || existing.claimed_by_phone !== authHeader) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("providers")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<unknown>>({ data, error: null });
  } catch (err) {
    console.error("[providers/[id] PATCH]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
