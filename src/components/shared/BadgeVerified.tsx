import { ShieldCheck } from "lucide-react";

/**
 * Le prestataire a revendiqué sa fiche en prouvant que le numéro est le sien.
 * Ça ne dit rien de la qualité de son travail : d'où « numéro » vérifié.
 * Compact (lignes de résultats) : l'icône seule, le libellé reste lu par les lecteurs d'écran.
 */
export function BadgeVerified({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full text-xs font-medium ${compact ? "p-1" : "px-2 py-0.5"}`}
      style={{
        backgroundColor: "var(--color-primary-light)",
        color: "var(--color-primary)",
      }}
      title={compact ? "Numéro vérifié" : undefined}
    >
      <ShieldCheck size={12} aria-hidden />
      <span className={compact ? "sr-only" : undefined}>Numéro vérifié</span>
    </span>
  );
}
