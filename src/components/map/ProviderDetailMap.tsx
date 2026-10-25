"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProviderWithDistance } from "@/types";
import { useSearchStore } from "@/store/useSearchStore";

const MapViewDynamic = dynamic(
  () => import("./MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-56 w-full rounded-2xl" />,
  }
);

interface ProviderDetailMapProps {
  lat: number;
  lng: number;
  name: string;
  userPosition?: { lat: number; lng: number };
  /** Par défaut une vignette ; l'ordinateur la fait remplir sa colonne. */
  className?: string;
}

export function ProviderDetailMap({ lat, lng, name, userPosition, className = "h-56 w-full rounded-2xl overflow-hidden" }: ProviderDetailMapProps) {
  const storedUser = useSearchStore((s) => s.userPosition);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const user = userPosition ?? storedUser ?? undefined;

  const pinProvider: ProviderWithDistance = {
    id: "map-pin",
    name,
    contact_phone: "",
    bio: null,
    address_label: null,
    zone_radius_km: 5,
    available: true,
    verified_at: null,
    claimed_at: null,
    avg_rating: 0,
    review_count: 0,
    disabled_at: null,
    created_at: "",
    updated_at: "",
    lat,
    lng,
    distance_km: 0,
    categories: [],
    cover_photo: null,
  };

  // Vue rapprochée et inclinée sur le quartier ; la page reste défilable
  // (la carte se manipule à deux doigts).
  return (
    <MapViewDynamic
      center={{ lat, lng }}
      providers={[pinProvider]}
      selectedProviderId="map-pin"
      userPosition={user}
      showUserMarker={!!user}
      zoom={16}
      initialTilt
      cooperative
      className={className}
    />
  );
}
