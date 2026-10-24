"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, MapPin, Plus, User } from "lucide-react";

// Navigation de l'app : barre du bas sur téléphone, rail à gauche sur
// ordinateur (lg). La place qu'elle occupe est réservée par globals.css
// (body:has([data-app-nav])) via --app-inset-left / --app-inset-bottom.

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/providers", icon: Map, label: "Explorer" },
  { href: "/providers/new", icon: Plus, label: "Ajouter", isPrimary: true },
  { href: "/dashboard", icon: User, label: "Mon espace" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/providers") {
    return pathname === "/providers" || (pathname.startsWith("/providers/") && !pathname.startsWith("/providers/new"));
  }
  return pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      data-app-nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[var(--app-inset-bottom)] items-stretch justify-around border-t pb-[env(safe-area-inset-bottom)] lg:inset-x-auto lg:top-0 lg:left-0 lg:h-auto lg:w-[var(--rail-width)] lg:flex-col lg:justify-start lg:gap-2 lg:border-t-0 lg:border-r lg:py-5"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <Link
        href="/"
        aria-label="NearYou, accueil"
        className="mb-6 hidden h-11 w-11 items-center justify-center self-center rounded-xl lg:flex"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <MapPin size={22} style={{ color: "var(--color-on-primary)" }} />
      </Link>

      {NAV_ITEMS.map(({ href, icon: Icon, label, isPrimary }) => {
        const active = isActive(pathname, href);

        if (isPrimary) {
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="app-nav-item group flex flex-col items-center justify-center gap-1 lg:order-last lg:mt-auto"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full transition-transform group-active:scale-95"
                style={{ backgroundColor: "var(--color-accent)", boxShadow: "var(--shadow-sm)" }}
              >
                <Icon size={22} style={{ color: "var(--color-text)" }} strokeWidth={2.25} />
              </span>
              <span className="sr-only lg:not-sr-only" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="app-nav-item flex flex-1 flex-col items-center justify-center gap-1 lg:flex-none lg:py-1"
            style={{
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              transition: "color var(--duration-fast) var(--ease-out)",
            }}
          >
            <span
              className="flex h-8 w-14 items-center justify-center rounded-full"
              style={{
                backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                transition: "background-color var(--duration-base) var(--ease-out)",
              }}
            >
              <Icon size={21} strokeWidth={active ? 2.25 : 1.75} />
            </span>
            <span className={active ? "font-semibold" : "font-medium"} style={{ fontSize: "var(--text-xs)" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
