import { MapPinOff } from "lucide-react";

// Repli quand la carte ne peut pas s'afficher (pas de WebGL, style injoignable) :
// on garde un moyen d'aller voir l'endroit.
export function MapUnavailable({ className, lat, lng }: { className?: string; lat?: number; lng?: number }) {
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 text-center ${className ?? ""}`}
      style={{ minHeight: 200, backgroundColor: "var(--color-surface-sunk)", color: "var(--color-text-muted)" }}
      role="status"
    >
      <MapPinOff size={22} />
      <p style={{ fontSize: "var(--text-sm)" }}>La carte ne peut pas s&apos;afficher sur cet appareil.</p>
      {hasPoint && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
          className="font-semibold underline underline-offset-4"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}
        >
          Voir l&apos;emplacement sur OpenStreetMap
        </a>
      )}
    </div>
  );
}
