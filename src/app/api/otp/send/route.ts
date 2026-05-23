import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOtpSms } from "@/lib/africa-talking";
import { otpSendSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = otpSendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { phone, provider_id, purpose } = parsed.data;
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  try {
    const supabase = await createServiceClient();

    const { error: insertError } = await supabase.from("otp_claims").insert({
      phone,
      provider_id: provider_id ?? null,
      code,
      purpose,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    try {
      await sendOtpSms(phone, code);
    } catch (smsErr) {
      // L'OTP est en base — on log l'erreur SMS mais on ne plante pas la route
      console.error("[otp/send] SMS failed:", smsErr);
      return NextResponse.json<ApiResponse<never>>(
        {
          data: null,
          error:
            "Le SMS n'a pas pu être envoyé. Vérifiez le numéro (format international : +225…) ou réessayez dans quelques instants.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json<ApiResponse<{ sent: boolean }>>({
      data: { sent: true },
      error: null,
    });
  } catch (err) {
    console.error("[otp/send]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur, réessayez." },
      { status: 500 }
    );
  }
}
