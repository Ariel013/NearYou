"use client";

import { useEffect, useRef, useState } from "react";
import { Marker } from "maplibre-gl";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/types";
import { createBrandMap, webglSupported, type MapLibreMap } from "./brand-map";
import { createDestinationPin } from "./ProviderMarker";
import { MapUnavailable } from "./MapUnavailable";

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (pos: { lat: number; lng: number }) => void;
}

export function LocationPicker({
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  onChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  // Composant chargé côté client seulement (ssr: false) : WebGL se teste au montage.
  const [unavailable, setUnavailable] = useState(() => !webglSupported());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (unavailable) return;
    let cancelled = false;

    createBrandMap({
      container: containerRef.current,
      center: { lat: initialLat, lng: initialLng },
      zoom: 15,
      cooperative: true,
      isCancelled: () => cancelled,
    })
      .then((map) => {
        if (!map) return;
        mapRef.current = map;
        const element = createDestinationPin();
        element.classList.add("ny-dest--draggable");
        element.setAttribute("aria-label", "Position du prestataire, à déplacer");
        const marker = new Marker({ element, anchor: "bottom", draggable: true })
          .setLngLat([initialLng, initialLat])
          .addTo(map);

        marker.on("dragend", () => {
          const { lat, lng } = marker.getLngLat();
          const pos = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
          setCoords(pos);
          onChange(pos);
        });
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

  return (
    <div>
      {unavailable ? (
        <MapUnavailable className="rounded-xl" />
      ) : (
        <div
          ref={containerRef}
          className="overflow-hidden"
          style={{ height: 260, borderRadius: "var(--radius-md)" }}
          aria-label="Sélectionner la position sur la carte"
        />
      )}
      <p
        className="mt-2 text-center"
        style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}
      >
        Glissez l&apos;épingle pour ajuster la position ·{" "}
        <strong className="tabular">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong>
      </p>
    </div>
  );
}
