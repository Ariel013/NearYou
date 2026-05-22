"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProviderAdminActionsProps {
  providerId: string;
  isDisabled: boolean;
}

export function ProviderAdminActions({ providerId, isDisabled }: ProviderAdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function toggle(action: "enable" | "disable") {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { toast.error("Erreur lors de la mise à jour"); return; }
      toast.success(action === "enable" ? "Fiche réactivée" : "Fiche désactivée");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {isDisabled ? (
        <Button
          size="sm"
          onClick={() => toggle("enable")}
          disabled={isLoading}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}
          aria-label="Réactiver cette fiche"
        >
          {isLoading ? "…" : "Réactiver"}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => toggle("disable")}
          disabled={isLoading}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
          aria-label="Désactiver cette fiche"
        >
          {isLoading ? "…" : "Désactiver"}
        </Button>
      )}
    </div>
  );
}
