"use client";

import { useState } from "react";
import type { ContactDay } from "@/app/api/providers/[id]/contacts/route";

// Une seule série (les mises en contact par jour) : pas de légende, le titre
// la nomme. Barres fines arrondies en haut, survol par barre, table pour les
// lecteurs d'écran.

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
const FULL_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function total(d: ContactDay) {
  return d.call + d.whatsapp + d.itinerary;
}

function detail(d: ContactDay) {
  const parts = [
    d.call && `${d.call} appel${d.call > 1 ? "s" : ""}`,
    d.whatsapp && `${d.whatsapp} WhatsApp`,
    d.itinerary && `${d.itinerary} itinéraire${d.itinerary > 1 ? "s" : ""}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "aucun contact";
}

export function ContactChart({ days }: { days: ContactDay[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map(total));
  const PLOT_H = 120;

  return (
    <figure>
      <div className="relative" style={{ height: PLOT_H + 28 }} onMouseLeave={() => setHover(null)}>
        {/* Ligne de base, discrète */}
        <div className="absolute inset-x-0" style={{ top: PLOT_H, height: 1, backgroundColor: "var(--color-border)" }} aria-hidden />
        <div className="absolute inset-0 flex items-stretch gap-1.5" aria-hidden>
          {days.map((d, i) => {
            const t = total(d);
            const h = t === 0 ? 2 : Math.max(6, Math.round((t / max) * PLOT_H));
            const isToday = i === days.length - 1;
            return (
              <div
                key={d.date}
                className="relative flex flex-1 flex-col items-center"
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
              >
                <div className="flex w-full justify-center" style={{ height: PLOT_H, alignItems: "flex-end" }}>
                  <div
                    style={{
                      width: "min(100%, 22px)",
                      height: h,
                      borderRadius: "4px 4px 0 0",
                      backgroundColor: t === 0
                        ? "var(--color-border)"
                        : hover === i || (hover === null && isToday) ? "var(--color-primary)" : "var(--color-primary-light-strong)",
                      transition: "background-color var(--duration-fast) var(--ease-out)",
                    }}
                  />
                </div>
                <span
                  className="mt-2"
                  style={{ fontSize: "11px", color: isToday ? "var(--color-text)" : "var(--color-text-muted)", fontWeight: isToday ? 600 : 400 }}
                >
                  {DAY_FMT.format(new Date(d.date)).replace(".", "")}
                </span>
              </div>
            );
          })}
        </div>

        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl px-3 py-2"
            style={{
              left: `${((hover + 0.5) / days.length) * 100}%`,
              top: 0,
              backgroundColor: "var(--color-text)",
              color: "var(--color-surface)",
              fontSize: "var(--text-xs)",
              whiteSpace: "nowrap",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <p className="font-semibold first-letter:uppercase">{FULL_FMT.format(new Date(days[hover].date))}</p>
            <p>{detail(days[hover])}</p>
          </div>
        )}
      </div>

      {/* Une table ignore la largeur de 1 px de sr-only : c'est son conteneur qui la masque */}
      <div className="sr-only">
      <table>
        <caption>Mises en contact par jour</caption>
        <thead>
          <tr><th>Jour</th><th>Appels</th><th>WhatsApp</th><th>Itinéraires</th></tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{FULL_FMT.format(new Date(d.date))}</td>
              <td>{d.call}</td>
              <td>{d.whatsapp}</td>
              <td>{d.itinerary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
