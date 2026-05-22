import { createServiceClient } from "@/lib/supabase/server";
import { CheckCircle, AlertCircle } from "lucide-react";
import { ReportActions } from "./ReportActions";

interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  reporter_ip: string | null;
  resolved_at: string | null;
  created_at: string;
  providers: { id: string; name: string; contact_phone: string; disabled_at: string | null } | null;
}

const REASON_LABELS: Record<string, string> = {
  fiche_incorrecte:       "Informations incorrectes",
  prestataire_inexistant: "Prestataire inexistant",
  avis_abusif:            "Avis abusif",
  contenu_inapproprie:    "Contenu inapproprié",
  doublon:                "Doublon",
};

export default async function AdminReportsPage() {
  const supabase = await createServiceClient();

  const { data: reports, error } = await supabase
    .from("reports")
    .select("*, providers(id, name, contact_phone, disabled_at)")
    .order("resolved_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .returns<ReportRow[]>();

  const pending  = (reports ?? []).filter((r) => !r.resolved_at);
  const resolved = (reports ?? []).filter((r) => r.resolved_at);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>
          Signalements
        </h1>
        {pending.length > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
          >
            {pending.length} en attente
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
          Erreur lors du chargement des signalements.
        </p>
      )}

      {pending.length === 0 && !error && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: "var(--color-success-light)" }}
        >
          <CheckCircle size={32} className="mx-auto mb-2" style={{ color: "var(--color-success)" }} />
          <p style={{ color: "var(--color-success)", fontWeight: 500 }}>
            Aucun signalement en attente
          </p>
        </div>
      )}

      {/* En attente */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--color-error)" }}>
            En attente ({pending.length})
          </h2>
          {pending.map((r) => (
            <ReportCard key={r.id} report={r} isPending />
          ))}
        </section>
      )}

      {/* Résolus */}
      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)" }}>
            Résolus ({resolved.length})
          </h2>
          {resolved.map((r) => (
            <ReportCard key={r.id} report={r} isPending={false} />
          ))}
        </section>
      )}
    </div>
  );
}

function ReportCard({ report: r, isPending }: { report: ReportRow; isPending: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-sm)",
        borderLeft: `3px solid ${isPending ? "var(--color-error)" : "var(--color-success)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isPending
              ? <AlertCircle size={14} style={{ color: "var(--color-error)" }} />
              : <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
            }
            <span className="font-semibold" style={{ fontSize: "var(--text-sm)" }}>
              {REASON_LABELS[r.reason] ?? r.reason}
            </span>
            {r.providers?.disabled_at && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
              >
                Fiche désactivée
              </span>
            )}
          </div>
          {r.providers && (
            <a
              href={`/providers/${r.providers.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
              style={{ color: "var(--color-primary)" }}
            >
              {r.providers.name} — {r.providers.contact_phone}
            </a>
          )}
        </div>
        <span style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
          {new Date(r.created_at).toLocaleDateString("fr-FR")}
        </span>
      </div>

      {r.details && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          {r.details}
        </p>
      )}

      {isPending && r.providers && (
        <ReportActions
          reportId={r.id}
          providerId={r.providers.id}
          isProviderDisabled={!!r.providers.disabled_at}
        />
      )}
    </div>
  );
}
