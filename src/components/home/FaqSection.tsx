"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_ITEMS = [
  {
    question: "Comment trouver un artisan près de moi ?",
    answer:
      "Active ta géolocalisation sur la page d'accueil ou saisis une ville dans la barre de recherche. Tu verras tous les artisans disponibles triés par distance.",
  },
  {
    question: "Les artisans sont-ils vérifiés ?",
    answer:
      "Les fiches peuvent être créées par n'importe qui de la communauté. Un artisan qui revendique sa fiche via WhatsApp est marqué \"Vérifié\" — son identité a été confirmée gratuitement.",
  },
  {
    question: "Comment revendiquer ma fiche en tant qu'artisan ?",
    answer:
      "Trouve ta fiche, appuie sur \"C'est ma fiche\", entre ton numéro de téléphone. Un code unique est généré : appuie sur \"Ouvrir WhatsApp\" et envoie le message pré-rempli à notre bot. La revendication est automatique, en quelques secondes, sans SMS ni inscription.",
  },
  {
    question: "Puis-je ajouter un artisan à la plateforme ?",
    answer:
      "Oui, sans compte ni inscription. Clique sur \"J'ajoute un artisan\", remplis le formulaire avec son nom, son métier et sa position. La fiche est publiée immédiatement.",
  },
  {
    question: "Le service est-il gratuit ?",
    answer:
      "Totalement gratuit pour les utilisateurs et les artisans. NearYou est un service communautaire sans frais.",
  },
  {
    question: "Comment contacter un artisan ?",
    answer:
      "Sur la fiche de chaque artisan tu trouveras un bouton \"Appeler\" et un bouton \"WhatsApp\". Un clic suffit, aucune médiation par la plateforme.",
  },
  {
    question: "Dans quelles villes le service est-il disponible ?",
    answer:
      "Pour l'instant principalement Cotonou et les alentours. La plateforme est communautaire — plus les gens ajoutent des artisans dans leur ville, plus elle grandit !",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span
          className="font-medium"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--color-text)",
            fontFamily: "var(--font-display)",
          }}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="pb-4"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                lineHeight: 1.65,
              }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="px-5 py-6">
      <h2
        className="font-bold mb-1"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          color: "var(--color-text)",
        }}
      >
        Questions fréquentes
      </h2>
      <p
        className="mb-5"
        style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
      >
        Tout ce que tu dois savoir avant de commencer.
      </p>

      <div
        className="rounded-2xl px-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.question} {...item} />
        ))}
      </div>
    </section>
  );
}
