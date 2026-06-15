"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BottomNav } from "@/components/shared/BottomNav";
import { PhoneInput } from "@/components/claim/PhoneInput";
import { ClaimResult } from "@/components/claim/ClaimResult";
import { WhatsAppWaiting } from "@/components/claim/WhatsAppWaiting";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import type { ApiResponse } from "@/types";
import type { Provider } from "@/lib/supabase/types";
import type { WaClaimInitResult } from "@/app/api/claim/whatsapp/init/route";

type Step = "phone" | "waiting" | "result";

function ClaimPageContent() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") ?? "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const [waToken, setWaToken] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [waExpiresAt, setWaExpiresAt] = useState("");

  const [result, setResult] = useState<{ found: boolean; provider?: Provider } | null>(null);

  const { login } = useAuthStore();

  async function initWhatsAppClaim() {
    if (!phoneValid) {
      setPhoneError("Numéro de téléphone invalide");
      return;
    }
    setIsLoading(true);
    setPhoneError(undefined);

    const res = await fetch("/api/claim/whatsapp/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const json: ApiResponse<WaClaimInitResult> = await res.json();
    setIsLoading(false);

    if (json.error) {
      toast.error(json.error);
      return;
    }

    setWaToken(json.data!.token);
    setWaUrl(json.data!.wa_url);
    setWaExpiresAt(json.data!.expires_at);
    setStep("waiting");
  }

  function handleVerified(provider?: Provider) {
    if (provider) {
      login(phone, provider.id);
    }
    setResult({ found: !!provider, provider });
    setStep("result");
  }

  function handleExpired() {
    setStep("phone");
    toast.error("Code expiré. Recommencez pour en obtenir un nouveau.");
  }

  const stepIndex = ["phone", "waiting", "result"].indexOf(step);

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
          {step === "waiting" && "Vérification WhatsApp"}
          {step === "result" && "Résultat"}
        </h1>
        <div className="mt-2 flex gap-1.5">
          {(["phone", "waiting", "result"] as Step[]).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: i <= stepIndex ? "var(--color-primary)" : "var(--color-border)" }}
            />
          ))}
        </div>
      </header>

      <div className="px-5 py-8 max-w-sm mx-auto">
        {step === "phone" && (
          <div className="space-y-6">
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Entrez le numéro de téléphone associé à votre fiche. Vous recevrez un code de vérification via WhatsApp.
            </p>
            <PhoneInput
              value={phone}
              onChange={(v, valid) => { setPhone(v); setPhoneValid(valid); setPhoneError(undefined); }}
              error={phoneError}
              disabled={isLoading}
            />
            <Button className="w-full" onClick={initWhatsAppClaim} disabled={isLoading}>
              {isLoading ? "Génération du code…" : "Continuer"}
            </Button>
          </div>
        )}

        {step === "waiting" && (
          <WhatsAppWaiting
            token={waToken}
            waUrl={waUrl}
            expiresAt={waExpiresAt}
            phone={phone}
            onVerified={handleVerified}
            onExpired={handleExpired}
          />
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
