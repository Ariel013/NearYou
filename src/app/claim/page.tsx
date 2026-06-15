"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BottomNav } from "@/components/shared/BottomNav";
import { PhoneInput } from "@/components/claim/PhoneInput";
import { ClaimResult } from "@/components/claim/ClaimResult";
import { WhatsAppCodeEntry } from "@/components/claim/WhatsAppCodeEntry";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import type { ApiResponse, ClaimResult as ClaimResultType } from "@/types";
import type { Provider } from "@/lib/supabase/types";
import type { WaClaimInitResult } from "@/app/api/claim/whatsapp/init/route";

type Step = "phone" | "code" | "result";

function ClaimPageContent() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") ?? "";

  // Si le téléphone vient de l'URL (depuis une fiche), on le verrouille :
  // c'est le numéro de la fiche à revendiquer, on fait confiance à notre DB.
  const phoneLocked = !!initialPhone;

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [phoneValid, setPhoneValid] = useState(phoneLocked);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const [waExpiresAt, setWaExpiresAt] = useState("");
  const [result, setResult] = useState<{ found: boolean; provider?: Provider } | null>(null);

  const { login } = useAuthStore();

  async function initClaim() {
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

    setWaExpiresAt(json.data!.expires_at);
    setStep("code");
    toast.success("Code envoyé sur votre WhatsApp !");
  }

  async function verifyCode(code: string) {
    setIsLoading(true);

    const res = await fetch("/api/claim/whatsapp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
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

  function handleResend() {
    initClaim();
  }

  const stepIndex = ["phone", "code", "result"].indexOf(step);

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
          {step === "code" && "Code WhatsApp"}
          {step === "result" && "Résultat"}
        </h1>
        <div className="mt-2 flex gap-1.5">
          {(["phone", "code", "result"] as Step[]).map((s, i) => (
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
              {phoneLocked
                ? "Vous allez revendiquer cette fiche. Un code vous sera envoyé sur WhatsApp."
                : "Entrez le numéro de téléphone associé à votre fiche. Un code vous sera envoyé sur WhatsApp."}
            </p>

            {phoneLocked ? (
              <div
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid var(--color-border)" }}
              >
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Numéro de la fiche
                </p>
                <p className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}>
                  {phone}
                </p>
              </div>
            ) : (
              <PhoneInput
                value={phone}
                onChange={(v, valid) => { setPhone(v); setPhoneValid(valid); setPhoneError(undefined); }}
                error={phoneError}
                disabled={isLoading}
              />
            )}

            <Button className="w-full" onClick={initClaim} disabled={isLoading}>
              {isLoading ? "Envoi du code…" : "Recevoir mon code WhatsApp"}
            </Button>
          </div>
        )}

        {step === "code" && (
          <WhatsAppCodeEntry
            phone={phone}
            expiresAt={waExpiresAt}
            isLoading={isLoading}
            onVerify={verifyCode}
            onResend={handleResend}
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
