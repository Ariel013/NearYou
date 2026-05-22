import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ApiResponse } from "@/types";

const patchSchema = z.object({
  action: z.enum(["enable", "disable"]),
});

// PATCH — activer ou désactiver une fiche
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Action invalide (enable | disable)" },
      { status: 400 }
    );
  }

  const disabled_at = parsed.data.action === "disable" ? new Date().toISOString() : null;

  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("providers")
      .update({ disabled_at, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, disabled_at")
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<unknown>>({ data, error: null });
  } catch (err) {
    console.error("[admin/providers/[id] PATCH]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
