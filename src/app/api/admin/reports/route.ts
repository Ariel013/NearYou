import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// GET — liste tous les signalements (non résolus en premier)
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("reports")
      .select("*, providers(id, name, contact_phone, disabled_at)")
      .order("resolved_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json<ApiResponse<unknown[]>>({ data: data ?? [], error: null });
  } catch (err) {
    console.error("[admin/reports GET]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
