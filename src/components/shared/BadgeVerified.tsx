import { ShieldCheck } from "lucide-react";

export function BadgeVerified() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: "var(--color-primary-light)",
        color: "var(--color-primary)",
      }}
    >
      <ShieldCheck size={12} />
      Vérifié
    </span>
  );
}
