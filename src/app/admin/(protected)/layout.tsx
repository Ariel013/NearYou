import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Flag, Star, Users } from "lucide-react";
import { verifyAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = { title: "Administration — NearYou" };

const NAV_LINKS = [
  { href: "/admin/reports",   label: "Signalements", Icon: Flag },
  { href: "/admin/reviews",   label: "Avis",         Icon: Star },
  { href: "/admin/providers", label: "Prestataires", Icon: Users },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const ok = await verifyAdminSession();
  if (!ok) redirect("/admin/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-5 py-3"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Shield size={20} style={{ color: "var(--color-primary)" }} />
        <span
          className="flex-1 font-bold"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", color: "var(--color-primary)" }}
        >
          Admin — NearYou
        </span>
        <LogoutButton />
      </header>

      <div className="flex">
        {/* Sidebar (desktop) / bottom nav (mobile handled by tabs) */}
        <nav
          className="hidden md:flex flex-col gap-1 w-52 shrink-0 p-4 border-r min-h-[calc(100vh-53px)]"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          aria-label="Navigation admin"
        >
          {NAV_LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-colors hover:bg-[var(--color-primary-light)]"
              style={{ color: "var(--color-text)", fontSize: "var(--text-sm)" }}
            >
              <Icon size={16} style={{ color: "var(--color-primary)" }} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-5 md:p-8 max-w-4xl">
          {/* Mobile tab bar */}
          <nav
            className="flex md:hidden gap-1 mb-6 rounded-2xl p-1"
            style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
            aria-label="Navigation admin mobile"
          >
            {NAV_LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {children}
        </main>
      </div>
    </div>
  );
}
