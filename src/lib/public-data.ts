import type { PublicProvider, PublicReview } from "@/types";

// Retire d'une ligne de la base les données personnelles qui ne doivent
// jamais sortir d'une route publique. Toute fiche ou tout avis renvoyé au
// navigateur passe par ici.

export function toPublicProvider<T extends object>(
  row: T
): Omit<T, "claimed_by_phone" | "location"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { claimed_by_phone, location, ...rest } = row as T & {
    claimed_by_phone?: unknown;
    location?: unknown;
  };
  return rest;
}

export function toPublicReview<T extends object>(
  row: T
): Omit<T, "reviewer_phone"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reviewer_phone, ...rest } = row as T & { reviewer_phone?: unknown };
  return rest;
}

export type { PublicProvider, PublicReview };
