"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BottomNav } from "@/components/shared/BottomNav";
import { PhoneInput } from "@/components/claim/PhoneInput";
import { OtpInput } from "@/components/claim/OtpInput";
import { ClaimResult } from "@/components/claim/ClaimResult";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import type { ClaimResult as ClaimResultType, ApiResponse } from "@/types";
import type { Provider } from "@/lib/supabase/types";

type Step = "phone" | "otp" | "result";

function ClaimPageContent() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") ?? "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [phoneValid, setPhoneValid] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<{ found: boolean; provider?: Provider } | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const { login } = useAuthStore();

  async function sendOtp() {
    if (!phoneValid) {
      setPhoneError("Numéro de téléphone invalide");
      return;
    }
    setIsLoading(true);
    setPhoneError(undefined);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, purpose: "claim" }),
    });
    const json: ApiResponse<{ sent: boolean }> = await res.json();
    setIsLoading(false);

    if (json.error) {
      toast.error(json.error);
      return;
    }

    toast.success("Code envoyé par SMS");
    setStep("otp");
    startCountdown();
  }

  function startCountdown() {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function verifyOtp() {
    if (otp.replace(/\s/g, "").length < 6) {
      toast.error("Entrez les 6 chiffres du code");
      return;
    }
    setIsLoading(true);

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp.trim(), purpose: "claim" }),
    });
    const json: ApiResponse<ClaimResultType> = await res.json();
    setIsLoading(false);

    if (json.error) {
      toast.error(json.error);
      return;
    }

    const data = json.data!;
    if (data.found && data.provider) {
      login(phone, data.provider.id);
    }

    setResult({ found: data.found, provider: data.provider });
    setStep("result");
  }

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "var(--color-bg)" }}>
      <header
        className="sticky top-0 z-40 px-5 py-4"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)" }}
        >
          {step === "phone" && "Revendiquer ma fiche"}
          {step === "otp" && "Vérification"}
          {step === "result" && "Résultat"}
        </h1>
        {/* Step indicator */}
        <div className="mt-2 flex gap-1.5">
          {(["phone", "otp", "result"] as Step[]).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i <= ["phone", "otp", "result"].indexOf(step)
                    ? "var(--color-primary)"
                    : "var(--color-border)",
              }}
            />
          ))}
        </div>
      </header>

      <div className="px-5 py-8 max-w-sm mx-auto">
        {step === "phone" && (
          <div className="space-y-6">
            <div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Entrez le numéro de téléphone associé à votre fiche. Nous vous enverrons un code de vérification.
              </p>
            </div>
            <PhoneInput
              value={phone}
              onChange={(v, valid) => { setPhone(v); setPhoneValid(valid); setPhoneError(undefined); }}
              error={phoneError}
              disabled={isLoading}
            />
            <Button className="w-full" onClick={sendOtp} disabled={isLoading}>
              {isLoading ? "Envoi en cours…" : "Envoyer le code"}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-6">
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Code envoyé au <strong>{phone}</strong>. Entrez les 6 chiffres ci-dessous.
            </p>
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
            <Button className="w-full" onClick={verifyOtp} disabled={isLoading || otp.trim().length < 6}>
              {isLoading ? "Vérification…" : "Valider"}
            </Button>
            <div className="text-center">
              {countdown > 0 ? (
                <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                  Renvoyer dans {countdown}s
                </p>
              ) : (
                <button
                  onClick={sendOtp}
                  style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)" }}
                >
                  Renvoyer le code
                </button>
              )}
            </div>
          </div>
        )}

        {step === "result" && result && (
          <ClaimResult found={result.found} provider={result.provider} phone={phone} />
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default function ClaimPage() {
  return (
    <Suspense>
      <ClaimPageContent />
    </Suspense>
  );
}
