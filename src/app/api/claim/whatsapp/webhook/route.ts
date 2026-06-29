import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { safeNormalizePhoneE164, isCILegacyNumber, getCILegacyAlternates } from "@/lib/phone";
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

  const { token, from_phone: rawFromPhone, bot_secret } = parsed.data;

  if (bot_secret !== process.env.BOT_SECRET) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Non autorisé" },
      { status: 401 }
    );
  }

  // Normalise le numéro renvoyé par le bot (format WhatsApp peut diverger)
  const fromPhone = safeNormalizePhoneE164(rawFromPhone);
  console.log(`[claim/whatsapp/webhook] token="${token}" from_phone raw="${rawFromPhone}" normalized="${fromPhone}"`);

  try {
    const supabase = await createServiceClient();

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

    await supabase
      .from("whatsapp_claims")
      .update({ status: "verified", whatsapp_from: fromPhone, verified_at: new Date().toISOString() })
      .eq("id", claim.id);

    // Chercher la fiche : essai 1 — numéro exact tel que saisi lors de l'init
    const claimPhone = safeNormalizePhoneE164(claim.phone);
    console.log(`[claim/whatsapp/webhook] cherche provider avec contact_phone="${claimPhone}"`);

    let provider: Record<string, unknown> | null = null;

    const { data: providerExact } = await supabase
      .from("providers")
      .select("*")
      .eq("contact_phone", claimPhone)
      .is("claimed_at", null)
      .single();

    provider = providerExact ?? null;

    // Essai 2 — si le numéro est un ancien format CI, tenter les variantes modernes (07/05)
    if (!provider && isCILegacyNumber(claimPhone)) {
      const alternates = getCILegacyAlternates(claimPhone);
      console.log(`[claim/whatsapp/webhook] fallback CI legacy — variantes : ${alternates.join(", ")}`);

      for (const alt of alternates) {
        const { data: providerAlt } = await supabase
          .from("providers")
          .select("*")
          .eq("contact_phone", alt)
          .is("claimed_at", null)
          .single();

        if (providerAlt) {
          provider = providerAlt;
          console.log(`[claim/whatsapp/webhook] fiche trouvée via variante CI : "${alt}"`);
          break;
        }
      }
    }

    if (provider) {
      await supabase
        .from("providers")
        .update({
          claimed_at: new Date().toISOString(),
          claimed_by_phone: fromPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id as string);

      console.log(`[claim/whatsapp/webhook] provider claimed: id="${provider.id}" by="${fromPhone}"`);

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
