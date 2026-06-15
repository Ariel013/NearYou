import { Search, Star, Phone } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Cherche",
    description: "Saisis un métier ou une ville. Utilise ta géoloc pour voir les artisans autour de toi.",
  },
  {
    icon: Star,
    title: "Compare",
    description: "Consulte les fiches, les notes et les avis laissés par la communauté.",
  },
  {
    icon: Phone,
    title: "Contacte",
    description: "Appelle directement ou envoie un WhatsApp. Aucun compte requis.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-5 py-6">
      <h2
        className="font-bold mb-5"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          color: "var(--color-text)",
        }}
      >
        Comment ça marche ?
      </h2>

      <div className="space-y-4">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="flex items-start gap-4">
            {/* Step number + icon */}
            <div className="relative flex-shrink-0">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                }}
              >
                <Icon size={22} />
              </div>
              <span
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-bold"
                style={{
                  backgroundColor: "var(--color-primary)",
                  fontSize: "0.65rem",
                }}
              >
                {i + 1}
              </span>
            </div>

            {/* Text */}
            <div className="pt-0.5">
              <p
                className="font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-base)",
                  color: "var(--color-text)",
                }}
              >
                {title}
              </p>
              <p
                className="mt-0.5"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.55,
                }}
              >
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
