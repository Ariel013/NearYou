import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { suggestAddresses, type AddressSuggestion } from "@/lib/geocode";
import type { ApiResponse } from "@/types";

// ─── GET — Suggestions d'adresses pendant la frappe ───────────────────────

const schema = z.object({
  q: z.string().trim().min(3).max(80),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ data: null, error: "Paramètres invalides" }, { status: 400 });
  }

  // Le biais de proximité n'a pas besoin de plus de ~10 km de précision
  const { q } = parsed.data;
  const near = { lat: Number(parsed.data.lat.toFixed(1)), lng: Number(parsed.data.lng.toFixed(1)) };
  try {
    const data = await suggestAddresses(q, near);
    return NextResponse.json<ApiResponse<AddressSuggestion[]>>(
      { data, error: null },
      // Même frappe, même réponse : le CDN en garde une copie un jour
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch {
    // Service d'adresses indisponible : le champ reste un simple texte libre
    return NextResponse.json<ApiResponse<never>>({ data: null, error: "Suggestions indisponibles" }, { status: 502 });
  }
}
