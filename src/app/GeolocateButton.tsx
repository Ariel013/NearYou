"use client";

import { Locate } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSearchStore } from "@/store/useSearchStore";

export function GeolocateButton() {
  const { isLoading, retry } = useGeolocation();
  const setPosition = useSearchStore((s) => s.setPosition);

  function handleClick() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    retry();
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-full py-3 font-medium transition-opacity active:opacity-80 disabled:opacity-60"
      style={{
        backgroundColor: "var(--color-primary-light)",
        color: "var(--color-primary)",
        border: "1px solid var(--color-primary)",
        fontSize: "var(--text-sm)",
      }}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Locate size={18} />
      )}
      {isLoading ? "Localisation en cours…" : "Me géolocaliser"}
    </button>
  );
}
