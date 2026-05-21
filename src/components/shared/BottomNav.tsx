"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Map, Plus, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/providers", icon: Map, label: "Explorer" },
  { href: "/providers/new", icon: Plus, label: "Ajouter", isPrimary: true },
  { href: "/dashboard", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "64px",
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label, isPrimary }) => {
        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

        if (isPrimary) {
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <motion.span
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <Icon size={22} color="white" />
              </motion.span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
            style={{
              color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
              transition: "color var(--duration-fast) var(--ease-out)",
            }}
          >
            <motion.span
              animate={{ y: isActive ? -1 : 0 }}
              transition={{ duration: Number("0.15"), ease: "easeOut" }}
              className="flex flex-col items-center gap-0.5"
            >
              <Icon size={22} />
              <span style={{ fontSize: "var(--text-xs)" }}>{label}</span>
            </motion.span>
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute bottom-1 h-1 w-1 rounded-full"
                style={{ backgroundColor: "var(--color-primary)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
