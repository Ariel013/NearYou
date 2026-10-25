import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { placeLabel } from "@/lib/geocode";
import type { ApiResponse } from "@/types";

// ─── GET — Quartier d'un point posé sur la carte ──────────────────────────

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ data: null, error: "Paramètres invalides" }, { status: 400 });
  }

  // ~10 m de précision suffisent pour un quartier, et la réponse se met mieux en cache
  const lat = Number(parsed.data.lat.toFixed(4));
  const lng = Number(parsed.data.lng.toFixed(4));
  try {
    const label = await placeLabel({ lat, lng });
    return NextResponse.json<ApiResponse<{ label: string | null }>>(
      { data: { label }, error: null },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch {
    return NextResponse.json<ApiResponse<never>>({ data: null, error: "Quartier indisponible" }, { status: 502 });
  }
}
