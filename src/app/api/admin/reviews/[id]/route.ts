import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// DELETE — supprimer un avis abusif
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>(
      { data: { deleted: true }, error: null }
    );
  } catch (err) {
    console.error("[admin/reviews/[id] DELETE]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
