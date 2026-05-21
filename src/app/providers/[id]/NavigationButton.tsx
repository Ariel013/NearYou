"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { NavigationViewDynamic } from "@/components/map/NavigationViewDynamic";

interface NavigationButtonProps {
  name: string;
  lat: number;
  lng: number;
}

export function NavigationButton({ name, lat, lng }: NavigationButtonProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      {navOpen && (
        <NavigationViewDynamic
          target={{ name, lat, lng }}
          onClose={() => setNavOpen(false)}
        />
      )}
      <button
        onClick={() => setNavOpen(true)}
        className="flex items-center justify-center rounded-full px-4 py-3 transition-opacity active:opacity-70"
        style={{ backgroundColor: "var(--color-accent-light)", color: "var(--color-accent)" }}
        aria-label="Itinéraire"
      >
        <Navigation size={18} />
      </button>
    </>
  );
}
