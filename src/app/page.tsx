import Link from "next/link";
import { MapPin, Plus, Search } from "lucide-react";
import { AppNav } from "@/components/shared/AppNav";
import { CategoryPills } from "@/components/search/CategoryGrid";
import { HomeSearch } from "@/components/home/HomeSearch";
import { NearbyPreview } from "@/components/home/NearbyPreview";
import { FaqSection } from "@/components/home/FaqSection";
import { MediaOnly } from "@/components/shared/MediaOnly";

const STEPS = [
  { title: "Cherchez", text: "Un métier, un nom, ou ce qui est autour de vous." },
  { title: "Choisissez", text: "La distance, les avis, la disponibilité : tout est sur la fiche." },
  { title: "Contactez", text: "Un appel ou un WhatsApp, directement. Sans compte, sans frais." },
];

export default function HomePage() {
  return (
    <main className="home" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Téléphone : la marque (sur ordinateur, elle est dans le rail) */}
      <header className="flex items-center gap-2 px-5 pt-5 lg:hidden">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-hidden
        >
          <MapPin size={18} style={{ color: "var(--color-on-primary)" }} />
        </span>
        <span className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}>
          NearYou
        </span>
      </header>

      <div className="home-layout">
        {/* ─── Recherche d'abord ─── */}
        <section className="home-hero">
          <div className="space-y-6">
            <div>
              <h1
                className="font-bold leading-[1.05] tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)" }}
              >
                Le bon artisan,
                <br />
                <span style={{ color: "var(--color-primary)" }}>à deux pas</span> de chez vous.
              </h1>
              <p className="mt-4 max-w-[48ch]" style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                Plombiers, électriciens, couturières, coursiers… recommandés par vos voisins, à Cotonou,
                Abidjan et partout où la communauté en ajoute.
              </p>
            </div>
            <HomeSearch />
          </div>

          {/* Téléphone : l'aperçu vient après la recherche ; ordinateur : à droite */}
          <MediaOnly on="mobile">
            <div className="mt-8">
              <NearbyPreview />
            </div>
          </MediaOnly>
        </section>

        <aside className="home-aside hidden lg:block">
          <MediaOnly on="desktop">
            <NearbyPreview />
          </MediaOnly>
        </aside>

        {/* ─── Tous les métiers ─── */}
        <section className="home-section">
          <h2 className="section-title">Tous les métiers</h2>
          <CategoryPills />
        </section>

        {/* ─── Comment ça marche ─── */}
        <section className="home-section">
          <h2 className="section-title">Comment ça marche</h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className="flex gap-4 sm:flex-col sm:gap-2">
                <span
                  className="tabular flex-shrink-0 pt-0.5"
                  style={{ fontSize: "var(--text-xl)", color: "var(--color-accent-strong)" }}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-semibold" style={{ fontSize: "var(--text-base)" }}>{title}</p>
                  <p className="mt-1 max-w-[40ch]" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.55 }}>
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── La communauté fait l'annuaire ─── */}
        <section className="home-section">
          <div className="home-band">
            <div>
              <h2 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>
                Vous connaissez un bon artisan ?
              </h2>
              <p className="mt-2 max-w-[46ch]" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text-muted)" }}>
                Ajoutez-le en une minute, sans compte. Vous aidez un voisin à trouver, et lui à travailler.
              </p>
              <Link href="/providers/new" className="btn-soft btn-soft--accent mt-4">
                <Plus size={16} aria-hidden />
                Ajouter un prestataire
              </Link>
            </div>
            <div className="home-band__divider" aria-hidden />
            <div>
              <h2 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>
                Vous êtes artisan ?
              </h2>
              <p className="mt-2 max-w-[46ch]" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text-muted)" }}>
                Un client a peut-être déjà créé votre fiche. Cherchez votre nom pour la voir comme vos clients la voient.
              </p>
              <Link href="/providers" className="btn-soft mt-4">
                <Search size={16} aria-hidden />
                Chercher ma fiche
              </Link>
            </div>
          </div>
        </section>

        <section className="home-section">
          <FaqSection />
        </section>

        <footer className="home-section flex flex-wrap items-center justify-between gap-3 border-t pt-6 pb-2" style={{ borderColor: "var(--color-border)" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            NearYou · Bénin et Côte d&apos;Ivoire
          </p>
          <nav aria-label="Liens du pied de page" className="flex gap-5" style={{ fontSize: "var(--text-xs)" }}>
            <Link href="/providers" style={{ color: "var(--color-text-muted)" }}>Explorer</Link>
            <Link href="/providers/new" style={{ color: "var(--color-text-muted)" }}>Ajouter</Link>
            <a href="#faq" style={{ color: "var(--color-text-muted)" }}>Questions</a>
          </nav>
        </footer>
      </div>

      <AppNav />
    </main>
  );
}
