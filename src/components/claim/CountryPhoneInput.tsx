"use client";

import { useMemo, useState } from "react";
import { getCountries, getCountryCallingCode, parsePhoneNumberWithError, isValidPhoneNumber } from "libphonenumber-js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Drapeau emoji depuis le code ISO 2 lettres (pas de dépendance)
function toFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Nom du pays en français via l'API navigateur
const displayNames = typeof Intl !== "undefined"
  ? new Intl.DisplayNames(["fr"], { type: "region" })
  : null;

function countryName(iso: string): string {
  try { return displayNames?.of(iso) ?? iso; }
  catch { return iso; }
}

// Pays d'Afrique de l'Ouest/Centrale en tête de liste
const PRIORITY = ["BJ", "CI", "SN", "ML", "BF", "GN", "TG", "GH", "NG", "CM", "CD", "CG", "GA", "NE", "MR", "SL", "LR", "GM", "GW", "CV"];

interface CountryOption { iso: string; dial: string; name: string; flag: string }

function buildCountryList(): CountryOption[] {
  const all = getCountries().map((iso) => ({
    iso: iso as string,
    dial: `+${getCountryCallingCode(iso)}`,
    name: countryName(iso),
    flag: toFlag(iso),
  }));

  const priority = PRIORITY
    .map((iso) => all.find((c) => c.iso === iso))
    .filter((c): c is CountryOption => c != null);

  const rest = all
    .filter((c) => !PRIORITY.includes(c.iso))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return [...priority, rest[0] && { iso: "__sep__", dial: "", name: "──────────", flag: "" } as CountryOption, ...rest].filter(Boolean) as CountryOption[];
}

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
  const countries = useMemo(buildCountryList, []);
  const [selectedIso, setSelectedIso] = useState("BJ");
  const [localNumber, setLocalNumber] = useState("");

  function notify(iso: string, local: string) {
    const dial = `+${getCountryCallingCode(iso as Parameters<typeof getCountryCallingCode>[0])}`;
    const digits = local.replace(/\D/g, "");
    const full = `${dial}${digits}`;
    const valid = digits.length >= 4 && isValidPhoneNumber(full);
    let e164 = full;
    try {
      e164 = parsePhoneNumberWithError(full).format("E.164");
    } catch { /* keep full */ }
    onChange(e164, valid);
  }

  function handleCountryChange(iso: string) {
    if (iso === "__sep__") return;
    setSelectedIso(iso);
    notify(iso, localNumber);
  }

  function handleLocalChange(raw: string) {
    const cleaned = raw.replace(/[^\d\s\-]/g, "");
    setLocalNumber(cleaned);
    notify(selectedIso, cleaned);
  }

  const selectedCountry = countries.find((c) => c.iso === selectedIso);

  return (
    <div className="space-y-1.5">
      {label && <Label htmlFor={id}>{label} *</Label>}

      <div className="flex gap-2">
        {/* Select pays */}
        <select
          value={selectedIso}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          aria-label="Indicatif pays"
          className="shrink-0 rounded-lg px-2 py-2 outline-none transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            minWidth: "7rem",
          }}
        >
          {countries.map((c) =>
            c.iso === "__sep__" ? (
              <option key="__sep__" value="__sep__" disabled>──────────</option>
            ) : (
              <option key={c.iso} value={c.iso}>
                {c.flag} {c.dial} {c.name}
              </option>
            )
          )}
        </select>

        {/* Numéro local */}
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
          className="flex-1"
          style={{ borderColor: error ? "var(--color-error)" : undefined }}
        />
      </div>

      {/* Aperçu numéro complet */}
      {localNumber.replace(/\D/g, "").length > 0 && selectedCountry && (
        <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
          {selectedCountry.flag} Numéro complet : {selectedCountry.dial}{localNumber.replace(/\D/g, "")}
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
