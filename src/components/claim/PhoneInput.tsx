"use client";

import { useState } from "react";
import { parsePhoneNumberWithError, isValidPhoneNumber } from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, error, disabled }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return "+";
    const trimmed = value.trim();
    return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/\D/g, "")}`;
  });

  function handleChange(raw: string) {
    // Forcer le "+" comme premier caractère
    let sanitized = raw;
    if (!sanitized.startsWith("+")) {
      sanitized = "+" + sanitized.replace(/\D/g, "");
    }
    setDisplayValue(sanitized);

    const valid = sanitized.length >= 8 && isValidPhoneNumber(sanitized);

    let formatted = sanitized;
    try {
      formatted = parsePhoneNumberWithError(sanitized).format("E.164");
    } catch {
      // keep sanitized if parse fails
    }

    onChange(formatted, valid);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="phone-input">Numéro de téléphone</Label>
      <Input
        id="phone-input"
        type="tel"
        inputMode="tel"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="+225 05 02 00 00 00"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? "phone-error" : undefined}
        style={{ borderColor: error ? "var(--color-error)" : undefined }}
      />
      {error && (
        <p id="phone-error" style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>
          {error}
        </p>
      )}
      <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
        Exemples : +225 05 02 00 00 00 (CI) · +229 96 00 00 00 (BJ)
      </p>
    </div>
  );
}
