import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";
import type { Report } from "@/lib/supabase/types";

const AUTO_DISABLE_THRESHOLD = 3;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: provider_id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { reason, details } = parsed.data;
  const reporter_ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? null;

  try {
    const supabase = await createServiceClient();

    // Vérifier que le prestataire existe
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, disabled_at")
      .eq("id", provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Prestataire introuvable" },
        { status: 404 }
      );
    }

    // Insérer le signalement
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({ provider_id, reason, details: details ?? null, reporter_ip })
      .select()
      .single();

    if (insertError) throw insertError;

    // Compter les signalements non résolus pour ce prestataire
    const { count, error: countError } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider_id)
      .is("resolved_at", null);

    if (countError) throw countError;

    // Désactivation automatique au seuil
    if ((count ?? 0) >= AUTO_DISABLE_THRESHOLD && !provider.disabled_at) {
      await supabase
        .from("providers")
        .update({ disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", provider_id);
    }

    return NextResponse.json<ApiResponse<Report>>({ data: report, error: null }, { status: 201 });
  } catch (err) {
    console.error("[providers/[id]/reports POST]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors du signalement" },
      { status: 500 }
    );
  }
}
