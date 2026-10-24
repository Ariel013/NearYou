"use client";

import { MapPin } from "lucide-react";
import { useSearchStore } from "@/store/useSearchStore";
import { distanceKm, formatDistance } from "@/lib/geo";

interface ProviderPlaceProps {
  address: string | null;
  location: { lat: number; lng: number } | null;
}

/**
 * Où il est, et à quelle distance de vous : la première question de celui qui cherche.
 * La distance n'apparaît que si vous vous êtes localisé (on ne redemande pas la position ici).
 */
export function ProviderPlace({ address, location }: ProviderPlaceProps) {
  const position = useSearchStore((s) => s.userPosition);
  const km = position && location ? distanceKm(position, location) : null;
  if (!address && km === null) return null;

  return (
    <p className="mt-2 flex items-start gap-1.5" style={{ fontSize: "var(--text-sm)" }}>
      <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} aria-hidden />
      <span>
        {km !== null && (
          <>
            <span className="tabular font-semibold">{formatDistance(km)}</span> de vous
            {address && <span aria-hidden> · </span>}
          </>
        )}
        {address}
      </span>
    </p>
  );
}
