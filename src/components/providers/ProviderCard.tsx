"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { formatDistance } from "@/lib/geo";
import type { ProviderWithDistance } from "@/types";

interface ProviderCardProps {
  provider: ProviderWithDistance;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

/** Ligne de résultat : qui, quoi, à quelle distance, et si c'est sérieux. */
export function ProviderCard({ provider, onSelect, isSelected = false }: ProviderCardProps) {
  const initials = provider.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const category = provider.categories?.[0]?.name;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(provider.id)}
      aria-current={isSelected ? "true" : undefined}
      className="provider-row flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"
    >
      <span className="relative flex-shrink-0">
        {provider.cover_photo ? (
          <Image
            src={provider.cover_photo.url}
            alt=""
            width={52}
            height={52}
            className="rounded-xl object-cover"
            style={{ width: 52, height: 52 }}
          />
        ) : (
          <span
            aria-hidden
            className="flex items-center justify-center rounded-xl font-bold"
            style={{
              width: 52,
              height: 52,
              backgroundColor: "var(--color-accent-light)",
              color: "var(--color-accent-strong)",
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-base)",
            }}
          >
            {initials}
          </span>
        )}
        {provider.claimed_at && (
        <span
          className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2"
          style={{
            backgroundColor: provider.available ? "var(--color-success)" : "var(--color-text-light)",
            borderColor: "var(--color-surface)",
          }}
          aria-hidden
        />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className="truncate font-semibold"
            style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}
          >
            {provider.name}
          </span>
          {provider.claimed_at && <BadgeVerified compact />}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
        >
          {category && <span className="truncate">{category}</span>}
          {category && provider.claimed_at && <span aria-hidden>·</span>}
          {provider.claimed_at && <span>{provider.available ? "Disponible" : "Occupé"}</span>}
        </span>
      </span>

      <span className="flex flex-shrink-0 flex-col items-end gap-1">
        <span className="tabular" style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
          {formatDistance(provider.distance_km)}
        </span>
        {provider.review_count > 0 ? (
          <span className="flex items-center gap-1" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            <Star size={12} fill="var(--color-accent)" stroke="none" aria-hidden />
            <span className="tabular">{provider.avg_rating.toFixed(1)}</span>
            <span className="sr-only">sur 5, {provider.review_count} avis</span>
          </span>
        ) : (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>Nouveau</span>
        )}
      </span>
    </button>
  );
}
