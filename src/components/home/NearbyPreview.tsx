"use client";

import { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchStore } from "@/store/useSearchStore";
import { useProviders } from "@/hooks/useProviders";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/types";

const MapViewDynamic = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
});

const PREVIEW_RADIUS_KM = 10;

/** Aperçu vivant : la vraie carte et le vrai nombre de prestataires autour. */
export function NearbyPreview() {
  const position = useSearchStore((s) => s.position);
  const userPosition = useSearchStore((s) => s.userPosition);
  const center = position ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
  const filters = useMemo(
    () => ({ lat: center.lat, lng: center.lng, radius_km: PREVIEW_RADIUS_KM, sort: "distance" as const }),
    [center.lat, center.lng]
  );
  const { providers, isLoading } = useProviders(filters);

  const count = providers.length;
  const label = isLoading
    ? "Recherche autour de vous…"
    : count === 0
      ? "Personne encore dans ce quartier"
      : `${count} prestataire${count > 1 ? "s" : ""} à moins de ${PREVIEW_RADIUS_KM} km`;

  return (
    <Link
      href="/providers"
      className="nearby-preview group relative block overflow-hidden rounded-3xl"
      aria-label={`Ouvrir la carte. ${label}.`}
    >
      {/* inert : les épingles (boutons) ne doivent pas être atteignables dans un lien */}
      <div className="pointer-events-none absolute inset-0" inert>
        <MapViewDynamic
          center={center}
          providers={providers}
          userPosition={userPosition ?? undefined}
          zoom={13.5}
          initialTilt
          interactive={false}
          controls={false}
          className="absolute inset-0"
        />
      </div>
      <div className="nearby-preview__caption">
        <div className="min-w-0">
          <p className="font-semibold" style={{ fontSize: "var(--text-base)" }}>
            Près de vous
          </p>
          <p className="truncate" aria-live="polite" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            {label}
          </p>
        </div>
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
          style={{ backgroundColor: "var(--color-text)", color: "var(--color-surface)" }}
        >
          <ArrowRight size={18} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
