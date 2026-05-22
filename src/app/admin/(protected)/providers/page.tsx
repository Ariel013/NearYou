import { createServiceClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { ProviderAdminActions } from "./ProviderAdminActions";

interface ProviderRow {
  id: string;
  name: string;
  contact_phone: string;
  avg_rating: number;
  review_count: number;
  claimed_at: string | null;
  verified_at: string | null;
  disabled_at: string | null;
  created_at: string;
}

export default async function AdminProvidersPage() {
  const supabase = await createServiceClient();

  const { data: providers, error } = await supabase
    .from("providers")
    .select("id, name, contact_phone, avg_rating, review_count, claimed_at, verified_at, disabled_at, created_at")
    .order("disabled_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<ProviderRow[]>();

  const disabled = (providers ?? []).filter((p) => p.disabled_at);
  const active   = (providers ?? []).filter((p) => !p.disabled_at);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>
          Prestataires
        </h1>
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          {active.length} actif{active.length !== 1 ? "s" : ""} · {disabled.length} désactivé{disabled.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
          Erreur lors du chargement.
        </p>
      )}

      {/* Désactivés en premier */}
      {disabled.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--color-error)" }}>
            Désactivés ({disabled.length})
          </h2>
          {disabled.map((p) => (
            <ProviderRow key={p.id} provider={p} />
          ))}
        </section>
      )}

      {/* Actifs */}
      <section className="space-y-3">
        <h2 className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)" }}>
          Actifs ({active.length})
        </h2>
        {active.map((p) => (
          <ProviderRow key={p.id} provider={p} />
        ))}
      </section>
    </div>
  );
}

function ProviderRow({ provider: p }: { provider: ProviderRow }) {
  const isDisabled = !!p.disabled_at;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-sm)",
        borderLeft: `3px solid ${isDisabled ? "var(--color-error)" : "var(--color-success)"}`,
        opacity: isDisabled ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/providers/${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}
            >
              {p.name}
            </a>
            {p.claimed_at && (
              <ShieldCheck size={14} style={{ color: "var(--color-primary)" }} aria-label="Fiche revendiquée" />
            )}
            {isDisabled && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
              >
                Désactivée
              </span>
            )}
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            {p.contact_phone} · ⭐ {Number(p.avg_rating).toFixed(1)} ({p.review_count} avis)
          </p>
          <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
            Créée le {new Date(p.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isDisabled
            ? <XCircle size={18} style={{ color: "var(--color-error)" }} />
            : <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
          }
        </div>
      </div>

      <ProviderAdminActions
        providerId={p.id}
        isDisabled={isDisabled}
      />
    </div>
  );
}
