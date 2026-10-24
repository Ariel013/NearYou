"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhatsAppClaimStatus } from "@/lib/supabase/types";
import type { Provider } from "@/lib/supabase/types";

interface WhatsAppWaitingProps {
  token: string;
  waUrl: string;
  expiresAt: string;
  phone: string;
  onVerified: (provider?: Provider) => void;
  onExpired: () => void;
}

const POLL_INTERVAL_MS = 3000;

export function WhatsAppWaiting({
  token,
  waUrl,
  expiresAt,
  phone,
  onVerified,
  onExpired,
}: WhatsAppWaitingProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Compte à rebours
  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Polling du statut toutes les 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/claim/whatsapp/status/${token}`);
        const json = await res.json();
        const status: WhatsAppClaimStatus = json.data?.status;

        if (status === "verified") {
          clearInterval(interval);
          onVerified(json.data?.provider);
        } else if (status === "expired" || secondsLeft === 0) {
          clearInterval(interval);
          onExpired();
        }
      } catch {
        // silencieux — on réessaie au prochain tick
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token, secondsLeft, onVerified, onExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${minutes}:${secs.toString().padStart(2, "0")}`;
  const isExpired = secondsLeft === 0;

  return (
    <div className="space-y-6">
      {/* Instruction principale */}
      <div className="rounded-2xl p-5 text-center space-y-3"
        style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid var(--color-primary)" }}
      >
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Numéro de la fiche
        </p>
        <p className="font-semibold" style={{ color: "var(--color-text)", fontSize: "var(--text-base)" }}>
          {phone}
        </p>
      </div>

      <div className="space-y-2 text-center">
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 500 }}>
          Étape 1 — Ouvrez WhatsApp
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Appuyez sur le bouton ci-dessous. Un message sera pré-rempli avec votre code.
        </p>
      </div>

      {/* Bouton WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold transition-opacity active:opacity-80"
        style={{ backgroundColor: "#25D366", color: "var(--color-on-primary)", fontSize: "var(--text-base)" }}
      >
        <MessageCircle size={20} />
        Ouvrir WhatsApp
      </a>

      <div className="space-y-2 text-center">
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 500 }}>
          Étape 2 — Envoyez le message
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Le message contient votre code <strong>{token}</strong>. Appuyez simplement sur Envoyer.
        </p>
      </div>

      {/* Statut attente */}
      {!isExpired ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            <RefreshCw size={16} className="animate-spin" />
            <span style={{ fontSize: "var(--text-sm)" }}>En attente de votre message…</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--color-text-light)" }}>
            <Clock size={14} />
            <span style={{ fontSize: "var(--text-xs)" }}>
              Code valide encore {timeDisplay}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-4 text-center"
          style={{ backgroundColor: "var(--color-error-light)", border: "1px solid var(--color-error)" }}
        >
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", fontWeight: 500 }}>
            Code expiré
          </p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 4 }}>
            Recommencez depuis le début pour obtenir un nouveau code.
          </p>
        </div>
      )}

      {isExpired && (
        <Button variant="outline" className="w-full" onClick={onExpired}>
          Recommencer
        </Button>
      )}
    </div>
  );
}
