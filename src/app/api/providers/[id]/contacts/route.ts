import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { contactEventSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: provider_id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = contactEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("contacts")
      .insert({ provider_id, contact_type: parsed.data.contact_type });

    if (error) throw error;

    return NextResponse.json<ApiResponse<{ logged: boolean }>>({
      data: { logged: true },
      error: null,
    });
  } catch (err) {
    console.error("[contacts POST]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
