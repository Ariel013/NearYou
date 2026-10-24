import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { contactEventSchema } from "@/lib/validations";
import { authorizeProviderOwner } from "@/lib/provider-owner";
import type { ApiResponse } from "@/types";

const DAYS = 14;
const MAX_ROWS = 5000;
const CONTACT_TYPES = ["call", "whatsapp", "itinerary"] as const;
type ContactType = (typeof CONTACT_TYPES)[number];

export interface ContactDay {
  /** Jour UTC, AAAA-MM-JJ */
  date: string;
  call: number;
  whatsapp: number;
  itinerary: number;
}

export interface ContactStats {
  /** Les 14 derniers jours, du plus ancien à aujourd'hui */
  days: ContactDay[];
}

/**
 * Mises en contact des 14 derniers jours, par jour et par type. Réservé au
 * propriétaire de la fiche : ce sont ses chiffres, pas une donnée publique.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json<ApiResponse<never>>({ data: null, error: "Fiche inconnue" }, { status: 400 });
  }

  try {
    const owner = await authorizeProviderOwner(id);
    if (!owner.ok) return owner.response;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const since = new Date(today.getTime() - (DAYS - 1) * 86_400_000);

    const { data, error } = await owner.supabase
      .from("contacts")
      .select("contact_type, created_at")
      .eq("provider_id", id)
      .gte("created_at", since.toISOString())
      .limit(MAX_ROWS);
    if (error) throw error;

    const days: ContactDay[] = Array.from({ length: DAYS }, (_, i) => ({
      date: new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10),
      call: 0,
      whatsapp: 0,
      itinerary: 0,
    }));
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const row of data ?? []) {
      const day = byDate.get(String(row.created_at).slice(0, 10));
      const type = row.contact_type as ContactType;
      if (day && CONTACT_TYPES.includes(type)) day[type] += 1;
    }

    return NextResponse.json<ApiResponse<ContactStats>>({ data: { days }, error: null });
  } catch (err) {
    console.error("[contacts GET]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Statistiques indisponibles" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: provider_id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = contactEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("contacts")
      .insert({ provider_id, contact_type: parsed.data.contact_type });

    if (error) throw error;

    return NextResponse.json<ApiResponse<{ logged: boolean }>>({
      data: { logged: true },
      error: null,
    });
  } catch (err) {
    console.error("[contacts POST]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
