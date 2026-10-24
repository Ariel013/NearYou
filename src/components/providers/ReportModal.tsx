"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ReportReason } from "@/lib/supabase/types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "fiche_incorrecte",       label: "Informations incorrectes" },
  { value: "prestataire_inexistant", label: "Ce prestataire n'existe pas" },
  { value: "contenu_inapproprie",    label: "Contenu inapproprié" },
  { value: "doublon",                label: "Fiche en double" },
];

interface ReportModalProps {
  providerId: string;
  onClose: () => void;
}

export function ReportModal({ providerId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) { toast.error("Sélectionnez une raison"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/providers/${providerId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erreur lors du signalement"); return; }
      setDone(true);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Signaler cette fiche"
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-3xl p-6 space-y-5 max-w-sm mx-auto"
        style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={18} style={{ color: "var(--color-error)" }} />
            <h2 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)" }}>
              Signaler cette fiche
            </h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-full p-1">
            <X size={18} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Signalement enregistré. Notre équipe examinera cette fiche.
            </p>
            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            {/* Reason selector */}
            <div className="space-y-2">
              <p className="font-medium" style={{ fontSize: "var(--text-sm)" }}>Raison du signalement</p>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      border: `1.5px solid ${reason === r.value ? "var(--color-primary)" : "var(--color-border)"}`,
                      backgroundColor: reason === r.value ? "var(--color-primary-light)" : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-[var(--color-primary)]"
                    />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div className="space-y-1.5">
              <label htmlFor="report-details" className="font-medium" style={{ fontSize: "var(--text-sm)" }}>
                Précisions <span style={{ color: "var(--color-text-light)" }}>(optionnel)</span>
              </label>
              <textarea
                id="report-details"
                rows={2}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Décrivez le problème…"
                className="w-full resize-none rounded-2xl px-4 py-3 outline-none transition-colors"
                style={{
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
              />
            </div>

            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: "var(--color-error)", color: "var(--color-on-primary)" }}
              onClick={submit}
              disabled={!reason || isLoading}
              aria-label="Envoyer le signalement"
            >
              {isLoading ? "Envoi…" : "Envoyer le signalement"}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
