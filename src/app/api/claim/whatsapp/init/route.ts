import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { waClaimInitSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O et 1/I pour éviter confusion
const EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS_PER_PHONE = 3;
const RATE_WINDOW_MINUTES = 30;

function generateToken(): string {
  let token = "GS-";
  for (let i = 0; i < 8; i++) {
    token += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return token;
}

export interface WaClaimInitResult {
  token: string;
  wa_url: string;
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

  const { phone, provider_id } = parsed.data;

  try {
    const supabase = await createServiceClient();

    // Rate limit : max MAX_ATTEMPTS_PER_PHONE demandes par numéro sur RATE_WINDOW_MINUTES minutes
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

    const botNumber = process.env.NEXT_PUBLIC_WA_BOT_NUMBER ?? "";
    const message = encodeURIComponent(`Code GéoService : ${token}`);
    const waUrl = `https://wa.me/${botNumber}?text=${message}`;

    return NextResponse.json<ApiResponse<WaClaimInitResult>>({
      data: { token, wa_url: waUrl, expires_at: expiresAt },
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
