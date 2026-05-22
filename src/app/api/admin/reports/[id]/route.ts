import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// PATCH — résoudre un signalement
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("reports")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<unknown>>({ data, error: null });
  } catch (err) {
    console.error("[admin/reports/[id] PATCH]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
