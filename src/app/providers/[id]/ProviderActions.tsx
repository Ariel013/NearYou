"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Flag } from "lucide-react";
import { ReviewSheet } from "@/components/providers/ReviewSheet";
import { ReportModal } from "@/components/providers/ReportModal";

export function ReviewButton({ providerId, first = false }: { providerId: string; first?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-soft btn-soft--accent">
        <Star size={16} aria-hidden />
        {first ? "Laisser le premier avis" : "Laisser un avis"}
      </button>
      {open && (
        <ReviewSheet
          providerId={providerId}
          onClose={(submitted) => {
            setOpen(false);
            if (submitted) router.refresh();
          }}
        />
      )}
    </>
  );
}

export function ReportButton({ providerId }: { providerId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-1.5 font-medium"
        style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
      >
        <Flag size={14} aria-hidden />
        Signaler une erreur
      </button>
      {open && <ReportModal providerId={providerId} onClose={() => setOpen(false)} />}
    </>
  );
}
