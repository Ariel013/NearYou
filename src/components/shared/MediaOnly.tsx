"use client";

import type { ReactNode } from "react";
import { useMediaQuery, DESKTOP_QUERY } from "@/hooks/useMediaQuery";

/** Ne monte son contenu que sur la taille d'écran demandée. Pour ce qui est
 *  coûteux (une carte) : masqué en CSS, il serait quand même chargé. */
export function MediaOnly({ on, children }: { on: "desktop" | "mobile"; children: ReactNode }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop !== (on === "desktop")) return null;
  return <>{children}</>;
}
