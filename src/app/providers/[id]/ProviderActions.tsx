"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Flag } from "lucide-react";
import { ReviewSheet } from "@/components/providers/ReviewSheet";
import { ReportModal } from "@/components/providers/ReportModal";

interface ProviderActionsProps {
  providerId: string;
}

export function ProviderActions({ providerId }: ProviderActionsProps) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);
  const [showReport, setShowReport] = useState(false);

  function handleReviewClose(submitted?: boolean) {
    setShowReview(false);
    if (submitted) router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => setShowReview(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-accent-light)",
            color: "var(--color-accent)",
            fontSize: "var(--text-sm)",
          }}
          aria-label="Laisser un avis"
        >
          <Star size={15} />
          Laisser un avis
        </button>

        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2.5 font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-error-light)",
            color: "var(--color-error)",
            fontSize: "var(--text-sm)",
          }}
          aria-label="Signaler cette fiche"
        >
          <Flag size={15} />
          Signaler
        </button>
      </div>

      {showReview && (
        <ReviewSheet providerId={providerId} onClose={handleReviewClose} />
      )}

      {showReport && (
        <ReportModal providerId={providerId} onClose={() => setShowReport(false)} />
      )}
    </>
  );
}
