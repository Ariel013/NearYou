"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AddressSuggestion } from "@/lib/geocode";
import type { ApiResponse } from "@/types";

interface AddressFieldProps {
  id: string;
  value: string;
  /** Frappe libre : le texte seul change. */
  onType: (value: string) => void;
  /** Suggestion choisie : le texte et la position de l'épingle. */
  onPick: (s: AddressSuggestion) => void;
  /** Point autour duquel on cherche d'abord (l'épingle actuelle). */
  near: { lat: number; lng: number };
}

const DEBOUNCE_MS = 300;

export function suggestionLabel(s: AddressSuggestion): string {
  return [s.name, s.context].filter(Boolean).join(", ").slice(0, 200);
}

/**
 * Champ adresse avec suggestions (motif « combobox » ARIA) : rues, quartiers et
 * lieux repères du Bénin et de la Côte d'Ivoire. Le texte libre reste toujours
 * accepté : « derrière la station Total » ne sera dans aucune base.
 */
export function AddressField({ id, value, onType, onPick, near }: AddressFieldProps) {
  const listId = useId();
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  // Pas de recherche juste après un choix : le texte vient de la suggestion
  const skipNext = useRef(false);
  const lat = Number(near.lat.toFixed(1));
  const lng = Number(near.lng.toFixed(1));

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?${new URLSearchParams({ q, lat: String(lat), lng: String(lng) })}`, { signal: ctrl.signal });
        const json: ApiResponse<AddressSuggestion[]> = await res.json();
        setItems(json.data ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        // Annulé ou service indisponible : on reste en texte libre
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value, lat, lng]);

  function pick(s: AddressSuggestion) {
    skipNext.current = true;
    onPick(s);
    setOpen(false);
    setItems([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && value.trim().length >= 3;

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList && items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onType(e.target.value);
          if (e.target.value.trim().length < 3) setOpen(false);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={(e) => {
          // Remonter le champ : la liste doit tenir entre lui et le clavier du téléphone
          e.currentTarget.scrollIntoView({ block: "start", behavior: "smooth" });
          if (items.length > 0) setOpen(true);
        }}
        placeholder="Un quartier, une rue, un lieu repère…"
        className="h-11 scroll-mt-24 pr-9"
      />
      {loading && (
        <Loader size={16} className="absolute right-3 top-3.5 animate-spin" style={{ color: "var(--color-text-muted)" }} aria-hidden />
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Adresses proposées"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl py-1"
          style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border)" }}
        >
          {items.length === 0 && !loading ? (
            <li className="px-4 py-3" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Aucune adresse connue. Votre texte sera gardé tel quel.
            </li>
          ) : (
            items.map((s, i) => (
              <li
                key={`${s.name}-${s.lat}-${s.lng}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown : choisir avant que le champ ne perde le focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className="flex min-h-[44px] cursor-pointer items-start gap-2.5 px-4 py-2.5"
                style={{ backgroundColor: i === active ? "var(--color-primary-light)" : undefined }}
              >
                <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-medium" style={{ fontSize: "var(--text-sm)" }}>{s.name}</span>
                  {s.context && (
                    <span className="block truncate" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {s.context}
                    </span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
