import { NextResponse } from "next/server";
import { PROVIDER_COOKIE_NAME } from "@/lib/provider-session";
import type { ApiResponse } from "@/types";

// Déconnexion du prestataire : efface le cookie de session
export async function DELETE() {
  const res = NextResponse.json<ApiResponse<{ ok: boolean }>>({
    data: { ok: true },
    error: null,
  });
  res.cookies.delete(PROVIDER_COOKIE_NAME);
  return res;
}
