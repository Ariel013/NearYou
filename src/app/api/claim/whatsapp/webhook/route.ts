import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { waClaimWebhookSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

export interface WaWebhookResult {
  found: boolean;   // fiche existante revendiquée
  created: boolean; // fiche n'existait pas (signal pour proposer la création)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = waClaimWebhookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Payload invalide" },
      { status: 400 }
    );
  }

  const { token, from_phone, bot_secret } = parsed.data;

  // Vérification du secret partagé avec le bot
  if (bot_secret !== process.env.BOT_SECRET) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Non autorisé" },
      { status: 401 }
    );
  }

  try {
    const supabase = await createServiceClient();

    // Récupérer le claim
    const { data: claim, error: claimError } = await supabase
      .from("whatsapp_claims")
      .select("*")
      .eq("token", token)
      .single();

    if (claimError || !claim) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Code inconnu" },
        { status: 404 }
      );
    }

    if (claim.status !== "pending") {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: claim.status === "expired" ? "Code expiré" : "Code déjà utilisé" },
        { status: 409 }
      );
    }

    if (new Date(claim.expires_at) < new Date()) {
      await supabase
        .from("whatsapp_claims")
        .update({ status: "expired" })
        .eq("id", claim.id);

      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Code expiré" },
        { status: 410 }
      );
    }

    // Marquer le claim comme vérifié
    await supabase
      .from("whatsapp_claims")
      .update({ status: "verified", whatsapp_from: from_phone, verified_at: new Date().toISOString() })
      .eq("id", claim.id);

    // Chercher la fiche correspondant au numéro saisi lors de l'init
    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("contact_phone", claim.phone)
      .is("claimed_at", null)
      .single();

    if (provider) {
      await supabase
        .from("providers")
        .update({
          claimed_at: new Date().toISOString(),
          claimed_by_phone: from_phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      return NextResponse.json<ApiResponse<WaWebhookResult>>({
        data: { found: true, created: false },
        error: null,
      });
    }

    return NextResponse.json<ApiResponse<WaWebhookResult>>({
      data: { found: false, created: false },
      error: null,
    });
  } catch (err) {
    console.error("[claim/whatsapp/webhook]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
