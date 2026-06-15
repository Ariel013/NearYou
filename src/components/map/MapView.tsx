"use client";

import { useEffect, useRef, useState } from "react";
import { getProviderMarkerHtml, getUserMarkerHtml } from "./ProviderMarker";
import type { ProviderWithDistance } from "@/types";

interface MapViewProps {
  center: { lat: number; lng: number };
  providers?: ProviderWithDistance[];
  selectedProviderId?: string;
  onMarkerClick?: (provider: ProviderWithDistance) => void;
  userPosition?: { lat: number; lng: number };
  showUserMarker?: boolean;
  className?: string;
  interactive?: boolean;
}

export function MapView({
  center,
  providers = [],
  selectedProviderId,
  onMarkerClick,
  userPosition,
  showUserMarker = true,
  className,
  interactive = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // ─── Init carte ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!containerRef.current || mapRef.current) return;

      const safeLat = Number.isFinite(center.lat) ? center.lat : 6.3659;
      const safeLng = Number.isFinite(center.lng) ? center.lng : 2.4183;

      const map = L.map(containerRef.current, {
        center: [safeLat, safeLng],
        zoom: 13,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILE_URL ??
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      if (showUserMarker) {
        const rawPos = userPosition ?? center;
        const pos = {
          lat: Number.isFinite(rawPos.lat) ? rawPos.lat : safeLat,
          lng: Number.isFinite(rawPos.lng) ? rawPos.lng : safeLng,
        };
        const userIcon = L.divIcon({
          className: "",
          html: getUserMarkerHtml(),
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([pos.lat, pos.lng], { icon: userIcon })
          .addTo(map)
          .bindTooltip("Vous êtes ici");
      }

      setMapReady(true);
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Markers prestataires (re-rendu quand liste ou sélection change) ─────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      providers.forEach((provider) => {
        const { lat, lng } = provider;
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;

        const isSelected = provider.id === selectedProviderId;
        const providerIcon = L.divIcon({
          className: "",
          html: getProviderMarkerHtml({
            initial: provider.name.slice(0, 1).toUpperCase(),
            isSelected,
          }),
          iconSize: isSelected ? [40, 40] : [32, 32],
          iconAnchor: isSelected ? [20, 20] : [16, 16],
        });

        const marker = L.marker([lat, lng], { icon: providerIcon, zIndexOffset: isSelected ? 1000 : 0 })
          .addTo(map)
          .bindTooltip(provider.name, { permanent: isSelected, direction: "top", offset: [0, isSelected ? -22 : -18] });

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(provider));
        }

        markersRef.current.push(marker);
      });
    })();
  }, [providers, onMarkerClick, mapReady, selectedProviderId]);

  // ─── Activer / désactiver les interactions (quand un sheet est ouvert) ────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    if (interactive) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [interactive, mapReady]);

  // ─── Re-centrage + zoom sur le prestataire sélectionné ───────────────────
  useEffect(() => {
    if (!mapRef.current || !Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;
    // Zoom 15 si un prestataire est sélectionné, sinon conserver le zoom actuel
    const targetZoom = selectedProviderId
      ? Math.max(mapRef.current.getZoom(), 15)
      : mapRef.current.getZoom();
    mapRef.current.setView([center.lat, center.lng], targetZoom, { animate: true });
  }, [center.lat, center.lng, selectedProviderId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 300 }}
      aria-label="Carte des prestataires"
    />
  );
}
