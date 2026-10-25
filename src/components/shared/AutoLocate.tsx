"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSearchStore } from "@/store/useSearchStore";

// Une seule demande par chargement de l'app, quelle que soit la page d'arrivée.
let asked = false;

/**
 * Demande la position dès l'ouverture : la recherche part de l'usager, pas d'une
 * ville par défaut. Refus ou échec : rien ne s'affiche, la carte reste sur la
 * ville par défaut et le bouton « Me localiser » permet de réessayer.
 */
export function AutoLocate() {
  const pathname = usePathname();
  const adopt = useSearchStore((s) => s.adoptUserPosition);

  useEffect(() => {
    if (asked || pathname.startsWith("/admin") || !navigator.geolocation) return;
    asked = true;

    const locate = () =>
      navigator.geolocation.getCurrentPosition(
        (pos) => adopt({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 }
      );

    // Déjà refusée : ne pas relancer une demande que le navigateur ignorera
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => { if (status.state !== "denied") locate(); })
        .catch(locate);
    } else {
      locate();
    }
  }, [pathname, adopt]);

  return null;
}
