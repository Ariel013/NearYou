import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizePhoneE164 } from "@/lib/phone";
import { otpVerifySchema } from "@/lib/validations";
import type { ApiResponse, ClaimResult } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { phone: rawPhone, code, purpose } = parsed.data;

  let phone: string;
  try {
    phone = normalizePhoneE164(rawPhone);
  } catch (err) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: (err as Error).message },
      { status: 400 }
    );
  }

  console.log(`[otp/verify] raw="${rawPhone}" normalized="${phone}" purpose="${purpose}"`);

  try {
    const supabase = await createServiceClient();

    const { data: otp, error: otpError } = await supabase
      .from("otp_claims")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("purpose", purpose)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otp) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    await supabase
      .from("otp_claims")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otp.id);

    if (purpose !== "claim") {
      return NextResponse.json<ApiResponse<ClaimResult>>({
        data: { found: false },
        error: null,
      });
    }

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

      console.log(`[otp/verify] provider claimed: id="${provider.id}" phone="${phone}"`);

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
    console.error("[otp/verify]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
