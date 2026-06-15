import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { waClaimVerifySchema } from "@/lib/validations";
import type { ApiResponse, ClaimResult } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = waClaimVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { phone, code } = parsed.data;
  const token = code.toUpperCase().trim();

  try {
    const supabase = await createServiceClient();

    const { data: claim, error: claimError } = await supabase
      .from("whatsapp_claims")
      .select("*")
      .eq("token", token)
      .eq("phone", phone)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (claimError || !claim) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Code invalide ou expiré. Vérifiez le code reçu sur WhatsApp." },
        { status: 400 }
      );
    }

    // Marquer comme utilisé
    await supabase
      .from("whatsapp_claims")
      .update({ status: "used", verified_at: new Date().toISOString() })
      .eq("id", claim.id);

    // Chercher la fiche correspondant au numéro
    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("contact_phone", phone)
      .is("claimed_at", null)
      .single();

    if (provider) {
      await supabase
        .from("providers")
        .update({
          claimed_at: new Date().toISOString(),
          claimed_by_phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      return NextResponse.json<ApiResponse<ClaimResult>>({
        data: { found: true, provider },
        error: null,
      });
    }

    return NextResponse.json<ApiResponse<ClaimResult>>({
      data: { found: false },
      error: null,
    });
  } catch (err) {
    console.error("[claim/whatsapp/verify]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
