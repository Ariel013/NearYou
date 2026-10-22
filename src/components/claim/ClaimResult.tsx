"use client";

import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { PublicProvider } from "@/types";

interface ClaimResultProps {
  found: boolean;
  provider?: PublicProvider;
  phone: string;
}

export function ClaimResult({ found, provider, phone }: ClaimResultProps) {
  if (found && provider) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle size={48} className="mx-auto" style={{ color: "var(--color-success)" }} />
        <div>
          <h2 className="font-semibold" style={{ fontSize: "var(--text-xl)", color: "var(--color-text)" }}>
            Fiche trouvée !
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            La fiche de <strong>{provider.name}</strong> correspond à votre numéro.
          </p>
        </div>
        <div
          className="rounded-2xl p-4 text-left"
          style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid var(--color-primary)" }}
        >
          <p style={{ fontWeight: 600, color: "var(--color-text)" }}>{provider.name}</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>{provider.address_label}</p>
        </div>
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center rounded-full py-3 font-medium transition-opacity active:opacity-80"
          style={{ backgroundColor: "var(--color-primary)", color: "white" }}
        >
          Accéder à mon tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <AlertCircle size={48} className="mx-auto" style={{ color: "var(--color-warning)" }} />
      <div>
        <h2 className="font-semibold" style={{ fontSize: "var(--text-xl)", color: "var(--color-text)" }}>
          Aucune fiche trouvée
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Votre numéro <strong>{phone}</strong> n&apos;est associé à aucune fiche existante.
          Créez votre fiche maintenant !
        </p>
      </div>
      <Link
        href={`/providers/new?phone=${encodeURIComponent(phone)}`}
        className="flex w-full items-center justify-center rounded-full py-3 font-medium transition-opacity active:opacity-80"
        style={{ backgroundColor: "var(--color-primary)", color: "white" }}
      >
        Créer ma fiche
      </Link>
    </div>
  );
}
