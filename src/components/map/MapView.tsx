"use client";

import { useEffect, useRef, useState } from "react";
import { Marker } from "maplibre-gl";
import { Box, Square } from "lucide-react";
import {
  createBrandMap,
  defaultTilt,
  prefersReducedMotion,
  setTilt,
  webglSupported,
  type MapLibreMap,
} from "./brand-map";
import { createProviderPin, createUserDot } from "./ProviderMarker";
import { MapUnavailable } from "./MapUnavailable";
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
  /** Vue inclinée au départ ; par défaut : oui sur grand écran. */
  initialTilt?: boolean;
  zoom?: number;
  /** Défilement de page prioritaire (carte insérée dans une page). */
  cooperative?: boolean;
}

const DEFAULT_LAT = 6.3659;
const DEFAULT_LNG = 2.4183;

export function MapView({
  center,
  providers = [],
  selectedProviderId,
  onMarkerClick,
  userPosition,
  showUserMarker = true,
  className,
  interactive = true,
  initialTilt,
  zoom = 13,
  cooperative = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  // Composant chargé côté client seulement (ssr: false) : WebGL se teste au montage.
  const [unavailable, setUnavailable] = useState(() => !webglSupported());
  const [tilted, setTilted] = useState(false);

  // ─── Init carte ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (unavailable) return;
    let cancelled = false;
    const tilt = initialTilt ?? defaultTilt();

    createBrandMap({
      container: containerRef.current,
      center: {
        lat: Number.isFinite(center.lat) ? center.lat : DEFAULT_LAT,
        lng: Number.isFinite(center.lng) ? center.lng : DEFAULT_LNG,
      },
      zoom,
      tilt,
      cooperative,
      isCancelled: () => cancelled,
    })
      .then((map) => {
        if (!map) return;
        mapRef.current = map;
        setTilted(tilt);
        map.once("load", () => setMapReady(true));
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Position de l'utilisateur ───────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (!showUserMarker) return;
    const pos = userPosition ?? center;
    if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) return;
    userMarkerRef.current = new Marker({ element: createUserDot() })
      .setLngLat([pos.lng, pos.lat])
      .addTo(mapRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, showUserMarker, userPosition?.lat, userPosition?.lng]);

  // ─── Épingles des prestataires ───────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    providers.forEach((provider) => {
      const { lat, lng } = provider;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
      const isSelected = provider.id === selectedProviderId;
      const element = createProviderPin({
        name: provider.name,
        isSelected,
        onClick: onMarkerClick ? () => onMarkerClick(provider) : undefined,
      });
      if (isSelected) element.style.zIndex = "2";
      markersRef.current.push(
        new Marker({ element, anchor: "bottom" }).setLngLat([lng, lat]).addTo(map)
      );
    });
  }, [providers, onMarkerClick, mapReady, selectedProviderId]);

  // ─── Interactions coupées quand un panneau est ouvert par-dessus ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const method = interactive ? "enable" : "disable";
    [map.dragPan, map.scrollZoom, map.touchZoomRotate, map.doubleClickZoom, map.boxZoom, map.keyboard, map.dragRotate]
      .forEach((h) => h[method]());
  }, [interactive, mapReady]);

  // ─── Recentrage sur le prestataire sélectionné ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;
    map.flyTo({
      center: [center.lng, center.lat],
      zoom: selectedProviderId ? Math.max(map.getZoom(), 15) : map.getZoom(),
      duration: prefersReducedMotion() ? 0 : 900,
      essential: false,
    });
  }, [center.lat, center.lng, selectedProviderId, mapReady]);

  function toggleTilt() {
    if (!mapRef.current) return;
    const next = !tilted;
    setTilt(mapRef.current, next);
    setTilted(next);
  }

  if (unavailable) {
    return <MapUnavailable className={className} lat={center.lat} lng={center.lng} />;
  }

  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className ?? "") ? "" : "relative"} ${className ?? ""}`} style={{ minHeight: 200 }}>
      <div ref={containerRef} className="absolute inset-0" aria-label="Carte des prestataires" role="region" />
      {mapReady && (
        <button
          type="button"
          onClick={toggleTilt}
          aria-pressed={tilted}
          aria-label={tilted ? "Passer en vue à plat" : "Passer en vue 3D"}
          className="map-chip absolute right-3 top-3 z-10"
        >
          {tilted ? <Square size={15} /> : <Box size={15} />}
          <span className="tabular">{tilted ? "2D" : "3D"}</span>
        </button>
      )}
    </div>
  );
}
