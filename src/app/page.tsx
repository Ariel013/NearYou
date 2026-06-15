import Link from "next/link";
import { MapPin } from "lucide-react";
import { CategoryGrid } from "@/components/search/CategoryGrid";
import { BottomNav } from "@/components/shared/BottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { DoubleCTA } from "@/components/home/DoubleCTA";
import { FaqSection } from "@/components/home/FaqSection";
import { WhatsAppFab } from "@/components/home/WhatsAppFab";

export default function HomePage() {
  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5 py-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={22} style={{ color: "var(--color-primary)" }} />
            <span
              className="font-bold"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                color: "var(--color-text)",
              }}
            >
              GéoService
            </span>
          </div>
          <Link
            href="/providers"
            className="rounded-full px-4 py-1.5 font-medium transition-colors"
            style={{
              border: "1px solid var(--color-primary)",
              color: "var(--color-primary)",
              fontSize: "var(--text-sm)",
            }}
          >
            Explorer
          </Link>
        </div>
      </header>

      {/* Hero — titre animé + search + géoloc */}
      <HeroSection />

      {/* Divider */}
      <div className="mx-5 h-px" style={{ backgroundColor: "var(--color-border)" }} />

      {/* Catégories */}
      <section className="px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              color: "var(--color-text)",
            }}
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

      {/* Divider */}
      <div className="mx-5 h-px" style={{ backgroundColor: "var(--color-border)" }} />

      {/* Carte rapide */}
      <section className="px-5 py-6">
        <Link
          href="/providers"
          className="flex items-center justify-between rounded-2xl p-5 transition-shadow hover:shadow-lg active:opacity-90"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)`,
            color: "white",
          }}
        >
          <div>
            <p
              className="font-semibold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}
            >
              Explorer sur la carte
            </p>
            <p style={{ fontSize: "var(--text-sm)", opacity: 0.85, marginTop: "0.25rem" }}>
              Voir tous les artisans autour de toi
            </p>
          </div>
          <MapPin size={32} style={{ opacity: 0.85 }} />
        </Link>
      </section>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ backgroundColor: "var(--color-border)" }} />

      {/* Comment ça marche */}
      <HowItWorks />

      {/* Divider */}
      <div className="mx-5 h-px" style={{ backgroundColor: "var(--color-border)" }} />

      {/* Double CTA — artisan + contributeur */}
      <DoubleCTA />

      {/* Divider */}
      <div className="mx-5 h-px" style={{ backgroundColor: "var(--color-border)" }} />

      {/* FAQ */}
      <FaqSection />

      {/* Footer minimal */}
      <footer
        className="px-5 py-8 text-center"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin size={18} style={{ color: "var(--color-primary)" }} />
          <span
            className="font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
          >
            GéoService
          </span>
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>
          Le bon artisan, à deux pas de chez vous · Côte d&apos;Ivoire
        </p>
        <div className="flex justify-center gap-5 mt-4">
          {[
            { label: "Accueil", href: "/" },
            { label: "Explorer", href: "/providers" },
            { label: "Ajouter", href: "/providers/new" },
            { label: "FAQ", href: "#" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>

      {/* WhatsApp flottant */}
      <WhatsAppFab phone="22900000000" />

      <BottomNav />
    </main>
  );
}
