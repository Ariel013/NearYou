"use client";

import { useSyncExternalStore } from "react";

/** Vrai quand la requête média correspond. Faux au rendu serveur. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const DESKTOP_QUERY = "(min-width: 1024px)";
