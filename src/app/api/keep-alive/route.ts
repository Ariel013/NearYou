import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// Appelée chaque jour par le cron Vercel (voir vercel.json) : une lecture réelle
// en base suffit à empêcher Supabase de mettre le projet gratuit en pause
// après 7 jours d'inactivité.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    if (!cronSecret) console.error("[keep-alive] CRON_SECRET non défini");
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Non autorisé" },
      { status: 401 }
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").select("id").limit(1);

    if (error) throw error;

    return NextResponse.json<ApiResponse<{ alive: boolean }>>({
      data: { alive: true },
      error: null,
    });
  } catch (err) {
    console.error("[keep-alive GET]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Base injoignable" },
      { status: 500 }
    );
  }
}
