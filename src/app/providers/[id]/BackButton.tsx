"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Retour à l'écran précédent ; arrivé par un lien direct, retour à l'explorer. */
export function BackButton({ floating = false }: { floating?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/providers"))}
      className={`flex h-11 w-11 items-center justify-center rounded-full ${floating ? "absolute left-4 top-4 z-10" : ""}`}
      style={{ backgroundColor: "var(--color-surface)", boxShadow: floating ? "var(--shadow-md)" : "none" }}
      aria-label="Retour"
    >
      <ArrowLeft size={20} style={{ color: "var(--color-text)" }} />
    </button>
  );
}
