import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import type { Provider, WhatsAppClaimStatus } from "@/lib/supabase/types";

export interface WaClaimStatusResult {
  status: WhatsAppClaimStatus;
  provider?: Provider;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || !/^GS-[A-Z0-9]{8}$/.test(token)) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Token invalide" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceClient();

    const { data: claim, error } = await supabase
      .from("whatsapp_claims")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !claim) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Token introuvable" },
        { status: 404 }
      );
    }

    // Expirer automatiquement les tokens périmés
    if (claim.status === "pending" && new Date(claim.expires_at) < new Date()) {
      await supabase
        .from("whatsapp_claims")
        .update({ status: "expired" })
        .eq("id", claim.id);

      return NextResponse.json<ApiResponse<WaClaimStatusResult>>({
        data: { status: "expired" },
        error: null,
      });
    }

    if (claim.status !== "verified") {
      return NextResponse.json<ApiResponse<WaClaimStatusResult>>({
        data: { status: claim.status as WhatsAppClaimStatus },
        error: null,
      });
    }

    // Vérifiée : renvoyer la fiche si elle existe
    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("contact_phone", claim.phone)
      .single();

    return NextResponse.json<ApiResponse<WaClaimStatusResult>>({
      data: { status: "verified", provider: provider ?? undefined },
      error: null,
    });
  } catch (err) {
    console.error("[claim/whatsapp/status]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
