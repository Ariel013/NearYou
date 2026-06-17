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

      const pinIcon = L.divIcon({
        className: "",
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"
          style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35));cursor:grab;cursor:-webkit-grab">
          <path d="M17 2C9.82 2 4 7.82 4 15c0 9.65 11.9 23.08 12.37 23.64a.83.83 0 001.26 0C18.1 38.08 30 24.65 30 15 30 7.82 24.18 2 17 2z"
            fill="#1B6CA8" stroke="white" stroke-width="2.5"/>
          <circle cx="17" cy="15" r="5.5" fill="white"/>
          <circle cx="17" cy="15" r="3" fill="#1B6CA8"/>
        </svg>`,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon,
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
