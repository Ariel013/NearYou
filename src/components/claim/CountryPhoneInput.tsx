"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberWithError,
  isValidPhoneNumber,
} from "libphonenumber-js";
import { ChevronDown, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const displayNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["fr"], { type: "region" })
    : null;

function countryLabel(iso: string): string {
  try { return displayNames?.of(iso) ?? iso; }
  catch { return iso; }
}

// ── Data ─────────────────────────────────────────────────────────────────────

const PRIORITY = ["BJ","CI","SN","ML","BF","GN","TG","GH","NG","CM","CD","CG","GA","NE","MR"];

interface CountryOption { iso: string; dial: string; name: string; flag: string }

function buildList(): CountryOption[] {
  const all = getCountries().map((iso) => ({
    iso: iso as string,
    dial: `+${getCountryCallingCode(iso)}`,
    name: countryLabel(iso),
    flag: toFlag(iso),
  }));
  const priority = PRIORITY.map((p) => all.find((c) => c.iso === p)).filter(Boolean) as CountryOption[];
  const rest = all.filter((c) => !PRIORITY.includes(c.iso)).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return [...priority, ...rest];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CountryPhoneInputProps {
  onChange: (e164: string, isValid: boolean) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function CountryPhoneInput({
  onChange,
  error,
  disabled,
  label = "Téléphone",
  id = "phone-country",
}: CountryPhoneInputProps) {
  const countries = useMemo(buildList, []);
  const [selectedIso, setSelectedIso] = useState("BJ");
  const [localNumber, setLocalNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme le dropdown si clic extérieur
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = countries.find((c) => c.iso === selectedIso) ?? countries[0];

  const filtered = search.trim()
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search)
      )
    : countries;

  const [legacyCIWarning, setLegacyCIWarning] = useState(false);

  function notify(iso: string, local: string) {
    const dial = `+${getCountryCallingCode(iso as Parameters<typeof getCountryCallingCode>[0])}`;
    const digits = local.replace(/\D/g, "");
    const full = `${dial}${digits}`;

    // Détecte un ancien numéro CI à 8 chiffres locaux (pré-réforme 2015)
    const isOldCI = iso === "CI" && digits.length === 8;
    setLegacyCIWarning(isOldCI);

    const valid = digits.length >= 4 && isValidPhoneNumber(full);
    let e164 = full;
    try { e164 = parsePhoneNumberWithError(full).format("E.164"); }
    catch { /* keep full */ }
    onChange(e164, valid && !isOldCI);
  }

  function selectCountry(iso: string) {
    setSelectedIso(iso);
    setOpen(false);
    setSearch("");
    notify(iso, localNumber);
  }

  function handleLocalChange(raw: string) {
    const cleaned = raw.replace(/[^\d\s\-]/g, "");
    setLocalNumber(cleaned);
    notify(selectedIso, cleaned);
  }

  return (
    <div className="space-y-1.5">
      {label && <Label htmlFor={id}>{label} *</Label>}

      <div className="flex gap-2 items-stretch">
        {/* ── Sélecteur pays (dropdown custom) ── */}
        <div ref={containerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => { if (!disabled) setOpen((v) => !v); }}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Choisir le pays"
            className="flex h-full items-center gap-1.5 rounded-lg px-3 py-2 transition-colors"
            style={{
              border: `1px solid ${open ? "var(--color-primary)" : "var(--color-border)"}`,
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              minWidth: "5.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <span>{selected.flag}</span>
            <span>{selected.dial}</span>
            <ChevronDown
              size={14}
              style={{
                color: "var(--color-text-muted)",
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 150ms",
              }}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div
              role="listbox"
              aria-label="Liste des pays"
              className="absolute left-0 top-full mt-1 z-50 rounded-2xl overflow-hidden"
              style={{
                width: "16rem",
                backgroundColor: "var(--color-surface)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Champ recherche */}
              <div className="p-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ backgroundColor: "var(--color-bg)" }}>
                  <Search size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un pays…"
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontSize: "var(--text-xs)", color: "var(--color-text)" }}
                    aria-label="Rechercher un pays"
                  />
                </div>
              </div>

              {/* Liste */}
              <ul className="overflow-y-auto" style={{ maxHeight: "14rem" }}>
                {filtered.length === 0 && (
                  <li className="px-4 py-3 text-center" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                    Aucun résultat
                  </li>
                )}
                {filtered.map((c) => (
                  <li key={c.iso}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.iso === selectedIso}
                      onClick={() => selectCountry(c.iso)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 transition-colors text-left"
                      style={{
                        backgroundColor: c.iso === selectedIso ? "var(--color-primary-light)" : "transparent",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text)",
                      }}
                    >
                      <span style={{ fontSize: "1.1em" }}>{c.flag}</span>
                      <span style={{ color: "var(--color-text-muted)", fontWeight: 500, flexShrink: 0 }}>{c.dial}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Numéro local ── */}
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder="96 00 00 00"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 min-w-0"
          style={{ borderColor: error ? "var(--color-error)" : undefined }}
        />
      </div>

      {/* Aperçu E.164 */}
      {localNumber.replace(/\D/g, "").length > 0 && (
        <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
          {selected.flag} Numéro complet : {selected.dial}{localNumber.replace(/\D/g, "")}
        </p>
      )}

      {/* Avertissement anciens numéros CI à 8 chiffres (pré-réforme 2015) */}
      {legacyCIWarning && (
        <p
          role="alert"
          style={{
            color: "var(--color-warning)",
            fontSize: "var(--text-xs)",
            backgroundColor: "var(--color-warning-light)",
            borderRadius: "var(--radius-sm)",
            padding: "0.4rem 0.6rem",
          }}
        >
          Numéro CI à 8 chiffres détecté. Depuis 2015, les numéros ivoiriens ont 10 chiffres (ex&nbsp;: <strong>07 56 89 04 77</strong>). Si votre numéro commence par 07 ou 05, ajoutez ces 2 chiffres au début.
        </p>
      )}

      {error && (
        <p id={`${id}-error`} style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
