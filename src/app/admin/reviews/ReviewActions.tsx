"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function deleteReview() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Erreur lors de la suppression"); return; }
      toast.success("Avis supprimé");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex gap-2 pt-1">
      <Button
        size="sm"
        onClick={deleteReview}
        disabled={isLoading}
        className="rounded-full text-xs flex items-center gap-1.5"
        style={{
          backgroundColor: confirmDelete ? "var(--color-error)" : "var(--color-error-light)",
          color: confirmDelete ? "white" : "var(--color-error)",
        }}
        aria-label="Supprimer cet avis"
      >
        <Trash2 size={12} />
        {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
      </Button>
      {confirmDelete && (
        <Button
          size="sm"
          onClick={() => setConfirmDelete(false)}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          Annuler
        </Button>
      )}
    </div>
  );
}
