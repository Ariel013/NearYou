import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizePhoneE164 } from "@/lib/phone";
import { reviewSchema } from "@/lib/validations";
import type { ApiResponse, PublicReview } from "@/types";
import type { Review } from "@/lib/supabase/types";
import { toPublicReview } from "@/lib/public-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("provider_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json<ApiResponse<PublicReview[]>>({ data: ((data ?? []) as Review[]).map(toPublicReview), error: null });
  } catch (err) {
    console.error("[reviews GET]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors du chargement des avis" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: provider_id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { rating, comment, reviewer_phone: rawReviewerPhone } = parsed.data;

  let reviewer_phone: string;
  try {
    reviewer_phone = normalizePhoneE164(rawReviewerPhone);
  } catch (err) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: (err as Error).message },
      { status: 400 }
    );
  }

  console.log(`[reviews POST] reviewer_phone raw="${rawReviewerPhone}" normalized="${reviewer_phone}"`);

  try {
    const supabase = await createServiceClient();

    const verifiedOtp = await supabase
      .from("otp_claims")
      .select("id")
      .eq("phone", reviewer_phone)
      .eq("purpose", "review")
      .not("used_at", "is", null)
      .gt("expires_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(1)
      .single();

    if (verifiedOtp.error || !verifiedOtp.data) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: "OTP non vérifié pour ce numéro" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({ provider_id, reviewer_phone, rating, comment: comment ?? null })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json<ApiResponse<never>>(
          { data: null, error: "Vous avez déjà laissé un avis pour ce prestataire" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json<ApiResponse<PublicReview>>({ data: toPublicReview(data as Review), error: null }, { status: 201 });
  } catch (err) {
    console.error("[reviews POST]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de la création de l'avis" },
      { status: 500 }
    );
  }
}
