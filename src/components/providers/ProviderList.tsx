"use client";

import Link from "next/link";
import { SearchX, Plus } from "lucide-react";
import { ProviderCard } from "./ProviderCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProviderWithDistance } from "@/types";

interface ProviderListProps {
  providers: ProviderWithDistance[];
  isLoading: boolean;
  error?: string | null;
  onSelect?: (id: string) => void;
  selectedId?: string;
  radiusKm: number;
  /** Proposé quand rien n'est trouvé et que le rayon peut encore s'élargir. */
  onWiden?: () => void;
}

export function ProviderList({
  providers,
  isLoading,
  error,
  onSelect,
  selectedId,
  radiusKm,
  onWiden,
}: ProviderListProps) {
  if (isLoading && !providers.length) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Chargement des prestataires">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-center" role="alert" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
        {error}. Vérifiez votre connexion et réessayez.
      </p>
    );
  }

  if (!providers.length) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <SearchX size={26} style={{ color: "var(--color-text-light)" }} aria-hidden />
        <p className="mt-3 font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}>
          Personne à moins de <span className="tabular">{radiusKm} km</span>
        </p>
        <p className="mt-1 max-w-[34ch]" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Élargissez la zone, déplacez la carte, ou ajoutez un prestataire que vous connaissez.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onWiden && (
            <button type="button" onClick={onWiden} className="btn-soft">
              Chercher à 50 km
            </button>
          )}
          <Link href="/providers/new" className="btn-soft btn-soft--accent">
            <Plus size={16} aria-hidden />
            Ajouter un prestataire
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-1" aria-busy={isLoading}>
      {providers.map((p) => (
        <li key={p.id}>
          <ProviderCard provider={p} onSelect={onSelect} isSelected={p.id === selectedId} />
        </li>
      ))}
    </ul>
  );
}
