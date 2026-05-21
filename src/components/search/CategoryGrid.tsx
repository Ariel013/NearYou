"use client";

import Link from "next/link";
import {
  Hammer, Wrench, Zap, Sparkles, Building, Paintbrush,
  Settings, Monitor, Scissors, User, Leaf, Bike, Wind, Shield, MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Hammer, Wrench, Zap, Sparkles, Building, Paintbrush,
  Settings, Monitor, Scissors, User, Leaf, Bike, Wind, Shield, MoreHorizontal,
};

export const CATEGORIES = [
  { slug: "menuiserie", name: "Menuiserie", icon_name: "Hammer" },
  { slug: "plomberie", name: "Plomberie", icon_name: "Wrench" },
  { slug: "electricite", name: "Électricité", icon_name: "Zap" },
  { slug: "menage", name: "Ménage", icon_name: "Sparkles" },
  { slug: "maconnerie", name: "Maçonnerie", icon_name: "Building" },
  { slug: "peinture", name: "Peinture", icon_name: "Paintbrush" },
  { slug: "mecanique", name: "Mécanique", icon_name: "Settings" },
  { slug: "informatique", name: "Informatique", icon_name: "Monitor" },
  { slug: "couture", name: "Couture", icon_name: "Scissors" },
  { slug: "coiffure", name: "Coiffure", icon_name: "User" },
  { slug: "jardinage", name: "Jardinage", icon_name: "Leaf" },
  { slug: "coursier", name: "Coursier", icon_name: "Bike" },
  { slug: "climatisation", name: "Climatisation", icon_name: "Wind" },
  { slug: "securite", name: "Sécurité", icon_name: "Shield" },
  { slug: "autre", name: "Autre", icon_name: "MoreHorizontal" },
];

interface CategoryGridProps {
  limit?: number;
  activeSlug?: string | null;
  onSelect?: (slug: string | null) => void;
}

export function CategoryGrid({ limit, activeSlug, onSelect }: CategoryGridProps) {
  const items = limit ? CATEGORIES.slice(0, limit) : CATEGORIES;

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ slug, name, icon_name }) => {
        const Icon = ICON_MAP[icon_name] ?? MoreHorizontal;
        const isActive = activeSlug === slug;

        const content = (
          <div
            className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-all"
            style={{
              backgroundColor: isActive ? "var(--color-primary-light)" : "var(--color-surface)",
              border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
              color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Icon size={24} />
            <span
              className="text-center leading-tight"
              style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}
            >
              {name}
            </span>
          </div>
        );

        if (onSelect) {
          return (
            <button
              key={slug}
              onClick={() => onSelect(isActive ? null : slug)}
              aria-label={name}
              className="text-left"
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={slug} href={`/providers?category=${slug}`} aria-label={name}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
