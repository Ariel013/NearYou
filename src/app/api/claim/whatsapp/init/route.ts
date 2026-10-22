import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizePhoneE164, isCILegacyNumber } from "@/lib/phone";
import { waClaimInitSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS_PER_PHONE = 3;
const RATE_WINDOW_MINUTES = 30;

function generateToken(): string {
  let token = "NY-";
  for (let i = 0; i < 8; i++) {
    // Générateur cryptographique : le code ouvre une session prestataire
    token += CHARS[randomInt(CHARS.length)];
  }
  return token;
}

export interface WaClaimInitResult {
  sent: boolean;
  phone: string;
  expires_at: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = waClaimInitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { phone: rawPhone, provider_id } = parsed.data;

  let phone: string;
  try {
    phone = normalizePhoneE164(rawPhone);
  } catch (err) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: (err as Error).message },
      { status: 400 }
    );
  }

  // Avertissement diagnostic : ancien format CI à 8 chiffres
  if (isCILegacyNumber(phone)) {
    console.warn(
      `[claim/whatsapp/init] Ancien format CI détecté : "${phone}". ` +
      `Ce numéro peut ne pas recevoir les messages si l'utilisateur est sur le nouveau format 10 chiffres.`
    );
  }

  console.log(`[claim/whatsapp/init] raw="${rawPhone}" normalized="${phone}"`);

  try {
    const supabase = await createServiceClient();

    // Rate limit : 3 tentatives max par numéro sur 30 minutes
    const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("whatsapp_claims")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS_PER_PHONE) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: `Trop de tentatives. Réessayez dans ${RATE_WINDOW_MINUTES} minutes.` },
        { status: 429 }
      );
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("whatsapp_claims").insert({
      token,
      phone,
      provider_id: provider_id ?? null,
      status: "pending",
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    const botUrl = process.env.BOT_URL;

    if (!botUrl) {
      console.log(`[WhatsApp][DEV] Code pour ${phone} : ${token}`);
    } else {
      const botRes = await fetch(`${botUrl}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_phone: phone,
          code: token,
          bot_secret: process.env.BOT_SECRET,
        }),
      });

      if (!botRes.ok) {
        const botErr = await botRes.json().catch(() => ({}));
        console.error("[claim/whatsapp/init] Bot error:", botErr);
        return NextResponse.json<ApiResponse<never>>(
          { data: null, error: "Impossible d'envoyer le message WhatsApp. Vérifiez que votre numéro est sur WhatsApp et réessayez." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json<ApiResponse<WaClaimInitResult>>({
      data: { sent: true, phone, expires_at: expiresAt },
      error: null,
    });
  } catch (err) {
    console.error("[claim/whatsapp/init]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur, réessayez." },
      { status: 500 }
    );
  }
}
