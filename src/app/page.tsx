import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { CategoryGrid } from "@/components/search/CategoryGrid";
import { BottomNav } from "@/components/shared/BottomNav";
import { GeolocateButton } from "./GeolocateButton";

export default function HomePage() {
  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5 py-4"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={22} style={{ color: "var(--color-primary)" }} />
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)" }}
            >
              GéoService
            </span>
          </div>
          <Link
            href="/providers/new"
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
              fontSize: "var(--text-sm)",
            }}
            aria-label="Ajouter un prestataire"
          >
            <Plus size={16} />
            Ajouter
          </Link>
        </div>
      </header>

      <div className="px-5 py-6 space-y-7">
        {/* Hero */}
        <section>
          <h1
            className="font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", color: "var(--color-text)" }}
          >
            Le bon artisan,<br />
            <span style={{ color: "var(--color-primary)" }}>à deux pas de chez vous</span>
          </h1>
          <p
            className="mt-2"
            style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)" }}
          >
            Trouvez un prestataire de confiance près de vous
          </p>
        </section>

        {/* Search */}
        <SearchBar />

        {/* Geolocate */}
        <GeolocateButton />

        {/* Categories */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="font-semibold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)" }}
            >
              Catégories
            </h2>
            <Link
              href="/providers"
              style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)" }}
            >
              Voir tout
            </Link>
          </div>
          <CategoryGrid limit={8} />
        </section>

        {/* Explore CTA */}
        <section>
          <Link
            href="/providers"
            className="flex items-center justify-between rounded-2xl p-5 transition-shadow hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)`,
              color: "white",
            }}
          >
            <div>
              <p className="font-semibold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}>
                Explorer les environs
              </p>
              <p style={{ fontSize: "var(--text-sm)", opacity: 0.85 }}>
                Voir tous les prestataires sur la carte
              </p>
            </div>
            <MapPin size={32} style={{ opacity: 0.8 }} />
          </Link>
        </section>

        {/* Claim CTA */}
        <section
          className="rounded-2xl p-5"
          style={{
            backgroundColor: "var(--color-accent-light)",
            border: "1px solid var(--color-accent)",
          }}
        >
          <p className="font-semibold" style={{ color: "var(--color-text)", fontSize: "var(--text-base)" }}>
            Vous êtes prestataire ?
          </p>
          <p className="mt-1" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Revendiquez votre fiche ou créez-en une nouvelle pour être visible par vos clients.
          </p>
          <Link
            href="/claim"
            className="mt-3 inline-block rounded-full px-4 py-2 font-medium transition-opacity active:opacity-80"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "white",
              fontSize: "var(--text-sm)",
            }}
          >
            Gérer ma fiche
          </Link>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
