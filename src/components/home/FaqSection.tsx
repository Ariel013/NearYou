import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Comment trouver un prestataire près de chez moi ?",
    answer:
      "Touchez « Autour de moi » ou cherchez un métier. La carte montre les prestataires les plus proches, triés par distance. Vous pouvez aussi déplacer la carte vers votre quartier.",
  },
  {
    question: "Faut-il créer un compte ?",
    answer:
      "Non. Chercher, voir une fiche, appeler ou écrire sur WhatsApp se fait sans compte et sans frais.",
  },
  {
    question: "Qui crée les fiches ?",
    answer:
      "La communauté : n'importe qui peut ajouter un prestataire qu'il connaît. Le badge « Vérifié » indique un prestataire qui a prouvé que le numéro de sa fiche est le sien.",
  },
  {
    question: "Je suis artisan, comment gérer ma fiche ?",
    answer:
      "Cherchez votre nom : un client a peut-être déjà créé votre fiche. La revendication par vérification du numéro est en cours de refonte ; elle reviendra bientôt.",
  },
  {
    question: "Dans quelles villes ?",
    answer:
      "Au Bénin et en Côte d'Ivoire, d'abord à Cotonou et Abidjan. Le service grandit avec chaque prestataire ajouté par la communauté.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-6">
      <h2 className="section-title">Questions fréquentes</h2>
      <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
        {FAQ_ITEMS.map(({ question, answer }) => (
          <details key={question} className="faq-item group border-b" style={{ borderColor: "var(--color-border)" }}>
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 py-3 font-semibold">
              <span style={{ fontSize: "var(--text-base)" }}>{question}</span>
              <ChevronDown
                size={18}
                aria-hidden
                className="flex-shrink-0 transition-transform group-open:rotate-180"
                style={{ color: "var(--color-text-muted)" }}
              />
            </summary>
            <p className="max-w-[65ch] pb-4" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
