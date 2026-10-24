"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReportActionsProps {
  reportId: string;
  providerId: string;
  isProviderDisabled: boolean;
}

export function ReportActions({ reportId, providerId, isProviderDisabled }: ReportActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function resolveReport() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH" });
      if (!res.ok) { toast.error("Erreur lors de la résolution"); return; }
      toast.success("Signalement résolu");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleProvider(action: "enable" | "disable") {
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
    <div className="flex flex-wrap gap-2 pt-1">
      <Button
        size="sm"
        onClick={resolveReport}
        disabled={isLoading}
        className="rounded-full text-xs"
        style={{ backgroundColor: "var(--color-success)", color: "var(--color-on-primary)" }}
      >
        Marquer résolu
      </Button>

      {isProviderDisabled ? (
        <Button
          size="sm"
          onClick={() => toggleProvider("enable")}
          disabled={isLoading}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
        >
          Réactiver la fiche
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => toggleProvider("disable")}
          disabled={isLoading}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
        >
          Désactiver la fiche
        </Button>
      )}
    </div>
  );
}
