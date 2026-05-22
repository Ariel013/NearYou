import { createServiceClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import { ReviewActions } from "./ReviewActions";

interface ReviewRow {
  id: string;
  provider_id: string;
  reviewer_phone: string;
  rating: number;
  comment: string | null;
  created_at: string;
  providers: { id: string; name: string } | null;
}

export default async function AdminReviewsPage() {
  const supabase = await createServiceClient();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*, providers(id, name)")
    .order("created_at", { ascending: false })
    .returns<ReviewRow[]>();

  return (
    <div className="space-y-6">
      <h1 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>
        Avis clients
      </h1>

      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
          Erreur lors du chargement des avis.
        </p>
      )}

      {!error && (!reviews || reviews.length === 0) && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Aucun avis pour l&apos;instant.
        </p>
      )}

      <ul className="space-y-3">
        {(reviews ?? []).map((r) => (
          <li
            key={r.id}
            className="rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= r.rating ? "var(--color-accent)" : "none"}
                        stroke={s <= r.rating ? "var(--color-accent)" : "var(--color-border)"}
                      />
                    ))}
                  </div>
                  <span className="font-semibold" style={{ fontSize: "var(--text-sm)" }}>
                    {r.rating}/5
                  </span>
                </div>
                {r.providers && (
                  <a
                    href={`/providers/${r.providers.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {r.providers.name}
                  </a>
                )}
                <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                  {r.reviewer_phone}
                </p>
              </div>
              <span style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                {new Date(r.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {r.comment && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                &ldquo;{r.comment}&rdquo;
              </p>
            )}

            <ReviewActions reviewId={r.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
