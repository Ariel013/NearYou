"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/search/SearchBar";
import { GeolocateButton } from "@/app/GeolocateButton";

const ROTATING_WORDS = [
  "menuisier",
  "plombier",
  "électricien",
  "maçon",
  "peintre",
  "mécanicien",
  "coiffeur",
  "coursier",
  "couturier",
];

export function HeroSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="px-5 pt-8 pb-6 space-y-6">
      {/* Headline */}
      <div>
        <h1
          className="font-bold leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            color: "var(--color-text)",
          }}
        >
          Trouve le bon
          <br />
          <span
            className="inline-flex items-center overflow-hidden"
            style={{ height: "1.2em", verticalAlign: "bottom" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={ROTATING_WORDS[index]}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ color: "var(--color-primary)", display: "inline-block" }}
              >
                {ROTATING_WORDS[index]}
              </motion.span>
            </AnimatePresence>
          </span>
          <br />
          près de chez toi
        </h1>

        <p
          className="mt-3"
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--text-base)",
            lineHeight: 1.6,
          }}
        >
          Des artisans locaux de confiance en Côte d'Ivoire. Plombiers, électriciens,
          menuisiers, peintres — contacte le bon pro en quelques secondes.
        </p>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <SearchBar placeholder="Rechercher un artisan…" />
        <GeolocateButton />
      </div>
    </section>
  );
}
