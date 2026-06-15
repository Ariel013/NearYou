"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppCodeEntryProps {
  phone: string;
  expiresAt: string;
  isLoading: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
}

const RESEND_DELAY = 60;

export function WhatsAppCodeEntry({
  phone,
  expiresAt,
  isLoading,
  onVerify,
  onResend,
}: WhatsAppCodeEntryProps) {
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [resendCountdown, setResendCountdown] = useState(RESEND_DELAY);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Compte à rebours expiration
  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Compte à rebours renvoyer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  function handleResend() {
    setResendCountdown(RESEND_DELAY);
    setCode("");
    onResend();
  }

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isExpired = secondsLeft === 0;
  const codeClean = code.toUpperCase().trim();
  const isValid = /^NY-[A-Z0-9]{8}$/.test(codeClean);

  return (
    <div className="space-y-6">
      {/* Info envoi */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid var(--color-primary)" }}
      >
        <MessageCircle size={20} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="font-medium" style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
            Code envoyé sur WhatsApp
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
            Vérifiez vos messages WhatsApp au numéro <strong>{phone}</strong>
          </p>
        </div>
      </div>

      {/* Saisie du code */}
      <div className="space-y-2">
        <label
          htmlFor="wa-code"
          className="font-medium"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}
        >
          Code reçu sur WhatsApp
        </label>
        <input
          id="wa-code"
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="NY-XXXXXXXX"
          maxLength={11}
          disabled={isLoading || isExpired}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-2xl border px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition-colors focus:ring-2"
          style={{
            borderColor: isValid ? "var(--color-primary)" : "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "var(--text-lg)",
          }}
        />
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)", textAlign: "center" }}>
          Format : NY-XXXXXXXX (indiqué dans le message WhatsApp)
        </p>
      </div>

      <Button
        className="w-full"
        onClick={() => onVerify(codeClean)}
        disabled={isLoading || !isValid || isExpired}
      >
        {isLoading ? "Vérification…" : "Valider le code"}
      </Button>

      {/* Timer + renvoyer */}
      <div className="flex flex-col items-center gap-2">
        {!isExpired ? (
          <div className="flex items-center gap-1.5" style={{ color: "var(--color-text-light)" }}>
            <Clock size={13} />
            <span style={{ fontSize: "var(--text-xs)" }}>
              Code valide encore {minutes}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        ) : (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-error)", fontWeight: 500 }}>
            Code expiré — demandez un nouveau code
          </p>
        )}

        {resendCountdown > 0 ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-light)" }}>
            Renvoyer dans {resendCountdown}s
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={isLoading}
            style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}
          >
            Renvoyer le code
          </button>
        )}
      </div>
    </div>
  );
}
