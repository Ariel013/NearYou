"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { StarRating } from "@/components/shared/StarRating";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { formatDistance } from "@/lib/geo";
import type { ProviderWithDistance } from "@/types";

interface ProviderCardProps {
  provider: ProviderWithDistance;
  onSelect?: (id: string) => void;
}

export function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  const initials = provider.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.button
      onClick={() => onSelect?.(provider.id)}
      className="w-full text-left"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <article
        className="flex gap-3 rounded-2xl p-4"
        style={{
          backgroundColor: "var(--color-surface)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {provider.cover_photo ? (
            <Image
              src={provider.cover_photo.url}
              alt={provider.name}
              width={56}
              height={56}
              className="rounded-full object-cover"
              style={{ width: 56, height: 56 }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full text-white font-semibold"
              style={{
                width: 56,
                height: 56,
                backgroundColor: "var(--color-primary)",
                fontSize: "var(--text-base)",
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-semibold truncate"
              style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}
            >
              {provider.name}
            </h3>
            {provider.claimed_at && <BadgeVerified />}
          </div>

          {provider.categories?.[0] && (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {provider.categories[0].name}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <StarRating rating={provider.avg_rating} count={provider.review_count} size="sm" />

            <span
              className="flex items-center gap-0.5"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}
            >
              <MapPin size={11} />
              {formatDistance(provider.distance_km)}
            </span>

            {provider.available ? (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: "var(--color-success-light)",
                  color: "var(--color-success)",
                }}
              >
                Disponible
              </span>
            ) : (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: "var(--color-warning-light)",
                  color: "var(--color-warning)",
                }}
              >
                Occupé
              </span>
            )}
          </div>
        </div>
      </article>
    </motion.button>
  );
}
