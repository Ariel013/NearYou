import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { waClaimVerifySchema } from "@/lib/validations";
import type { ApiResponse, ClaimResult, PublicProvider } from "@/types";
import { toPublicProvider } from "@/lib/public-data";
import {
  signProviderSession,
  PROVIDER_COOKIE_NAME,
  PROVIDER_COOKIE_OPTIONS,
} from "@/lib/provider-session";

export async function POST(req: NextRequest) {
  // JSON uniquement : un formulaire posté depuis un autre site ne doit pas
  // pouvoir ouvrir une session chez la victime
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Requête invalide" },
      { status: 415 }
    );
  }

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

    // Marquer comme utilisé, une seule fois : deux requêtes simultanées
    // avec le même code n'ouvrent pas deux sessions
    const { data: consumed } = await supabase
      .from("whatsapp_claims")
      .update({ status: "used", verified_at: new Date().toISOString() })
      .eq("id", claim.id)
      .eq("status", "pending")
      .select("id");

    if (!consumed?.length) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Code invalide ou expiré. Vérifiez le code reçu sur WhatsApp." },
        { status: 400 }
      );
    }

    // Chercher la fiche du numéro : libre, ou déjà revendiquée par ce même
    // numéro (le propriétaire se reconnecte sur un nouvel appareil)
    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("contact_phone", phone)
      .or(`claimed_at.is.null,claimed_by_phone.eq.${phone}`)
      .maybeSingle();

    if (provider) {
      if (!provider.claimed_at) {
        await supabase
          .from("providers")
          .update({
            claimed_at: new Date().toISOString(),
            claimed_by_phone: phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", provider.id);
      }

      const sessionToken = await signProviderSession({ phone, providerId: provider.id });
      const res = NextResponse.json<ApiResponse<ClaimResult>>({
        data: { found: true, provider: toPublicProvider(provider) as PublicProvider },
        error: null,
      });
      res.cookies.set(PROVIDER_COOKIE_NAME, sessionToken, PROVIDER_COOKIE_OPTIONS);
      return res;
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
