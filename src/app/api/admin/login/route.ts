import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPTIONS } from "@/lib/admin-auth";
import { z } from "zod";
import type { ApiResponse } from "@/types";

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Mot de passe requis" },
      { status: 400 }
    );
  }

  const adminPassword = process.env.ADMIN_SECRET;
  if (!adminPassword || parsed.data.password !== adminPassword) {
    await new Promise((r) => setTimeout(r, 500)); // anti-brute-force minimal
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: "Mot de passe incorrect" },
      { status: 401 }
    );
  }

  const token = await signAdminToken();

  const res = NextResponse.json<ApiResponse<{ ok: boolean }>>(
    { data: { ok: true }, error: null },
    { status: 200 }
  );

  res.cookies.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);

  return res;
}
