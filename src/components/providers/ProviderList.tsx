"use client";

import { ProviderCard } from "./ProviderCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProviderWithDistance } from "@/types";

interface ProviderListProps {
  providers: ProviderWithDistance[];
  isLoading: boolean;
  onSelect?: (id: string) => void;
}

export function ProviderList({ providers, isLoading, onSelect }: ProviderListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!providers.length) {
    return (
      <div className="py-12 text-center">
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)" }}>
          Aucun prestataire trouvé dans ce rayon.
        </p>
        <p
          className="mt-1"
          style={{ color: "var(--color-text-light)", fontSize: "var(--text-sm)" }}
        >
          Essayez d&apos;élargir le rayon de recherche.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {providers.map((p) => (
        <li key={p.id}>
          <ProviderCard provider={p} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
