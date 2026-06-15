import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ApiResponse } from "@/types";

const patchSchema = z.object({
  action: z.enum(["enable", "disable"]),
});

const putSchema = z.object({
  name: z.string().min(2).max(100),
  contact_phone: z.string().min(8).max(20),
  bio: z.string().max(500).optional(),
  address_label: z.string().max(200).optional(),
  available: z.boolean(),
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

// PUT — modifier les informations d'une fiche
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("providers")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<unknown>>({ data, error: null });
  } catch (err) {
    console.error("[admin/providers/[id] PUT]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — supprimer définitivement une fiche
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from("providers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      data: { deleted: true },
      error: null,
    });
  } catch (err) {
    console.error("[admin/providers/[id] DELETE]", err);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
