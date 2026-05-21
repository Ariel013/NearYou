"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm"
      style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
      aria-label="Retour"
    >
      <ArrowLeft size={20} style={{ color: "var(--color-text)" }} />
    </button>
  );
}
