import Link from "next/link";
import { ArrowRight, UserCheck, UserPlus } from "lucide-react";

export function DoubleCTA() {
  return (
    <section className="px-5 py-2 space-y-4">
      {/* Artisan CTA */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)`,
          color: "white",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <UserCheck size={20} />
          </div>
          <div>
            <p
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}
            >
              Tu es artisan ?
            </p>
            <p className="mt-1" style={{ fontSize: "var(--text-sm)", opacity: 0.85, lineHeight: 1.5 }}>
              Revendique ta fiche et commence à recevoir des clients depuis ta ville.
            </p>
          </div>
        </div>
        <Link
          href="/claim"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-opacity active:opacity-80"
          style={{
            backgroundColor: "white",
            color: "var(--color-primary)",
            fontSize: "var(--text-sm)",
          }}
        >
          Gérer ma fiche
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-2">
        <div className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
        <span style={{ color: "var(--color-text-light)", fontSize: "var(--text-sm)" }}>ou</span>
        <div className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
      </div>

      {/* Contributor CTA */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "var(--color-accent-light)",
              color: "var(--color-accent)",
            }}
          >
            <UserPlus size={20} />
          </div>
          <div>
            <p
              className="font-bold"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                color: "var(--color-text)",
              }}
            >
              Tu connais un bon artisan ?
            </p>
            <p
              className="mt-1"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              Aide ta communauté en ajoutant sa fiche. Gratuit, sans compte requis.
            </p>
          </div>
        </div>
        <Link
          href="/providers/new"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-opacity active:opacity-80"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "white",
            fontSize: "var(--text-sm)",
          }}
        >
          J&apos;ajoute un artisan
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
