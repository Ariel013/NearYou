"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/types";

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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const L = (await import("leaflet")).default;

      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        const pos = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
        setCoords(pos);
        onChange(pos);
      });

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    })();

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height: 260, borderRadius: "var(--radius-md)" }}
        aria-label="Sélectionner la position sur la carte"
      />
      <p
        className="mt-2 text-center"
        style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}
      >
        Glissez le marqueur pour ajuster la position ·{" "}
        <strong>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong>
      </p>
    </div>
  );
}
