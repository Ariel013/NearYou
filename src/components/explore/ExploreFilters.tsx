"use client";

import { CATEGORIES } from "@/components/search/CategoryGrid";

export const RADIUS_OPTIONS = [2, 5, 10, 25, 50] as const;

interface CategoryChipsProps {
  active: string | null;
  onChange: (slug: string | null) => void;
  /** Sur la carte (téléphone), les puces flottent : fond opaque et ombre. */
  floating?: boolean;
}

export function CategoryChips({ active, onChange, floating = false }: CategoryChipsProps) {
  const items = [{ slug: null as string | null, name: "Tout" }, ...CATEGORIES];
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4" role="group" aria-label="Catégories">
      <div className="flex w-max gap-2 pb-1">
        {items.map(({ slug, name }) => {
          const on = active === slug;
          return (
            <button
              key={slug ?? "tout"}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on && slug ? null : slug)}
              className="chip"
              data-floating={floating}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface RadiusPickerProps {
  value: number;
  onChange: (km: number) => void;
}

export function RadiusPicker({ value, onChange }: RadiusPickerProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Distance maximale">
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>À moins de</span>
      <div className="flex rounded-full p-0.5" style={{ backgroundColor: "var(--color-surface-sunk)" }}>
        {RADIUS_OPTIONS.map((km) => {
          const on = value === km;
          return (
            <button
              key={km}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(km)}
              className="tabular min-h-[44px] min-w-[44px] rounded-full px-2"
              style={{
                fontSize: "var(--text-xs)",
                backgroundColor: on ? "var(--color-surface)" : "transparent",
                color: on ? "var(--color-text)" : "var(--color-text-muted)",
                boxShadow: on ? "var(--shadow-sm)" : "none",
                fontWeight: on ? 600 : 500,
              }}
            >
              {km} km
            </button>
          );
        })}
      </div>
    </div>
  );
}
