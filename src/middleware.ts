import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminTokenFromRequest } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi  = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = getAdminTokenFromRequest(req);
  const valid = token ? await verifyAdminToken(token) : false;

  if (!valid) {
    if (isAdminApi) {
      return NextResponse.json({ data: null, error: "Non autorisé" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
