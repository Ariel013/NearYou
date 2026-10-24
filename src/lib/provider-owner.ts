import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getProviderSession } from "@/lib/provider-session";
import type { ApiResponse } from "@/types";

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export type OwnerCheck =
  | { ok: true; supabase: ServiceClient }
  | { ok: false; response: NextResponse<ApiResponse<never>> };

/**
 * Le prestataire connecté est-il propriétaire de cette fiche ? Seule autorité :
 * la session serveur émise à la revendication, revérifiée en base. Partagé par
 * toutes les routes réservées au propriétaire, pour qu'elles refusent pareil.
 */
export async function authorizeProviderOwner(providerId: string): Promise<OwnerCheck> {
  const session = await getProviderSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Session expirée, revendiquez à nouveau votre fiche" },
        { status: 401 }
      ),
    };
  }

  const supabase = await createServiceClient();
  const { data: existing } = await supabase
    .from("providers")
    .select("claimed_by_phone")
    .eq("id", providerId)
    .single();

  // La fiche doit être celle de la session, et toujours revendiquée par ce
  // numéro (une revendication retirée par l'admin coupe l'accès)
  if (
    !existing ||
    session.providerId !== providerId ||
    !existing.claimed_by_phone ||
    existing.claimed_by_phone !== session.phone
  ) {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse<never>>(
        { data: null, error: "Non autorisé" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, supabase };
}
