"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { PhoneInput } from "@/components/claim/PhoneInput";
import { OtpInput } from "@/components/claim/OtpInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Step = "phone" | "otp" | "form" | "done";

interface ReviewSheetProps {
  providerId: string;
  onClose: (submitted?: boolean) => void;
}

export function ReviewSheet({ providerId, onClose }: ReviewSheetProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [otp, setOtp] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendOtp() {
    if (!phoneValid) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "review" }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erreur lors de l'envoi"); return; }
      setStep("otp");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.replace(/\s/g, "").length < 6) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp.trim(), purpose: "review" }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Code invalide"); return; }
      setStep("form");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitReview() {
    if (rating === 0) { toast.error("Sélectionnez une note"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/providers/${providerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined, reviewer_phone: phone }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erreur lors de l'envoi"); return; }
      setStep("done");
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
        onClick={() => onClose()}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Laisser un avis"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-8 space-y-5"
        style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Handle */}
        <div className="flex justify-center">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>

        <h2 className="text-center font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}>
          {step === "done" ? "Merci !" : "Laisser un avis"}
        </h2>

        {step === "phone" && (
          <div className="space-y-4">
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Un code vous sera envoyé pour confirmer votre numéro.
            </p>
            <PhoneInput
              value={phone}
              onChange={(v, valid) => { setPhone(v); setPhoneValid(valid); }}
            />
            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              onClick={sendOtp}
              disabled={!phoneValid || isLoading}
              aria-label="Envoyer le code de vérification"
            >
              {isLoading ? "Envoi…" : "Envoyer le code"}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", textAlign: "center" }}>
              Code envoyé au {phone}
            </p>
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              onClick={verifyOtp}
              disabled={otp.replace(/\s/g, "").length < 6 || isLoading}
              aria-label="Vérifier le code"
            >
              {isLoading ? "Vérification…" : "Vérifier"}
            </Button>
            <button
              className="w-full text-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
              onClick={() => setStep("phone")}
            >
              Modifier le numéro
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            {/* Star selector */}
            <div className="space-y-1.5">
              <p className="font-medium" style={{ fontSize: "var(--text-sm)" }}>Note</p>
              <div className="flex justify-center gap-2" role="group" aria-label="Note de 1 à 5 étoiles">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform active:scale-110"
                  >
                    <Star
                      size={36}
                      fill={(hoverRating || rating) >= s ? "var(--color-accent)" : "none"}
                      stroke={(hoverRating || rating) >= s ? "var(--color-accent)" : "var(--color-border)"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="font-medium" style={{ fontSize: "var(--text-sm)" }}>
                Commentaire <span style={{ color: "var(--color-text-light)" }}>(optionnel)</span>
              </label>
              <textarea
                id="review-comment"
                rows={3}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience…"
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
              <p className="text-right" style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                {comment.length}/1000
              </p>
            </div>

            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              onClick={submitReview}
              disabled={rating === 0 || isLoading}
              aria-label="Publier l'avis"
            >
              {isLoading ? "Publication…" : "Publier l'avis"}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Votre avis a bien été publié.
            </p>
            <Button
              className="w-full rounded-full py-3"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              onClick={() => onClose(true)}
            >
              Fermer
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
