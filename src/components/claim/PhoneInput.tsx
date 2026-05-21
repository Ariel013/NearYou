"use client";

import { useState } from "react";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, error, disabled }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  function handleChange(raw: string) {
    setDisplayValue(raw);
    const normalized = raw.startsWith("+") ? raw : `+${raw.replace(/[^0-9]/g, "")}`;
    const valid = isValidPhoneNumber(normalized) || (raw.length >= 10 && isValidPhoneNumber(raw, "CI"));

    let formatted = raw;
    try {
      const parsed = parsePhoneNumber(normalized);
      if (parsed) formatted = parsed.format("E.164");
    } catch {
      // keep raw if parse fails
    }

    onChange(formatted, valid);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="phone-input">Numéro de téléphone</Label>
      <Input
        id="phone-input"
        type="tel"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="+229 96 00 00 00"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? "phone-error" : undefined}
        style={{
          borderColor: error ? "var(--color-error)" : undefined,
        }}
      />
      {error && (
        <p id="phone-error" style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>
          {error}
        </p>
      )}
      <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
        Format international recommandé : +229 96 00 00 00
      </p>
    </div>
  );
}
