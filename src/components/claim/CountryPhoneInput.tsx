"use client";

import { useState } from "react";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Country {
  flag: string;
  name: string;
  dial: string;
}

// Afrique de l'Ouest en premier, puis reste du monde
const COUNTRIES: Country[] = [
  { flag: "🇧🇯", name: "Bénin",           dial: "+229" },
  { flag: "🇨🇮", name: "Côte d'Ivoire",   dial: "+225" },
  { flag: "🇸🇳", name: "Sénégal",          dial: "+221" },
  { flag: "🇲🇱", name: "Mali",             dial: "+223" },
  { flag: "🇧🇫", name: "Burkina Faso",     dial: "+226" },
  { flag: "🇬🇳", name: "Guinée",           dial: "+224" },
  { flag: "🇹🇬", name: "Togo",             dial: "+228" },
  { flag: "🇬🇭", name: "Ghana",            dial: "+233" },
  { flag: "🇳🇬", name: "Nigeria",          dial: "+234" },
  { flag: "🇨🇲", name: "Cameroun",         dial: "+237" },
  { flag: "🇨🇩", name: "RD Congo",         dial: "+243" },
  { flag: "🇨🇬", name: "Congo",            dial: "+242" },
  { flag: "🇬🇦", name: "Gabon",            dial: "+241" },
  { flag: "🇲🇦", name: "Maroc",            dial: "+212" },
  { flag: "🇹🇳", name: "Tunisie",          dial: "+216" },
  { flag: "🇩🇿", name: "Algérie",          dial: "+213" },
  { flag: "🇫🇷", name: "France",           dial: "+33"  },
  { flag: "🇧🇪", name: "Belgique",         dial: "+32"  },
  { flag: "🇨🇭", name: "Suisse",           dial: "+41"  },
  { flag: "🇺🇸", name: "États-Unis",       dial: "+1"   },
];

interface CountryPhoneInputProps {
  value?: string;
  onChange: (e164: string, isValid: boolean) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function CountryPhoneInput({
  value = "",
  onChange,
  error,
  disabled,
  label = "Téléphone",
  id = "phone-country",
}: CountryPhoneInputProps) {
  const [selectedDial, setSelectedDial] = useState(COUNTRIES[0].dial); // Bénin par défaut
  const [localNumber, setLocalNumber] = useState("");

  function buildAndNotify(dial: string, local: string) {
    const digits = local.replace(/\D/g, "");
    const full = `${dial}${digits}`;
    const valid = digits.length >= 4 && isValidPhoneNumber(full);
    let e164 = full;
    try {
      const parsed = parsePhoneNumber(full);
      if (parsed) e164 = parsed.format("E.164");
    } catch { /* keep full */ }
    onChange(e164, valid);
  }

  function handleCountryChange(dial: string) {
    setSelectedDial(dial);
    buildAndNotify(dial, localNumber);
  }

  function handleLocalChange(raw: string) {
    // Garder uniquement les chiffres, espaces, tirets
    const cleaned = raw.replace(/[^\d\s\-]/g, "");
    setLocalNumber(cleaned);
    buildAndNotify(selectedDial, cleaned);
  }

  return (
    <div className="space-y-1.5">
      {label && <Label htmlFor={id}>{label} *</Label>}

      <div className="flex gap-2">
        {/* Select pays */}
        <select
          value={selectedDial}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          aria-label="Indicatif pays"
          className="shrink-0 rounded-lg px-2 py-2 font-medium outline-none transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "var(--text-sm)",
            minWidth: "6rem",
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.dial + c.name} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
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

      {/* Aperçu E.164 */}
      {localNumber && (
        <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
          Numéro complet : {selectedDial}{localNumber.replace(/\D/g, "")}
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
