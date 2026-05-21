"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(idx: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[idx] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next.padEnd(6, " ").trimEnd());
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!value[idx] || value[idx] === " ") {
        if (idx > 0) inputsRef.current[idx - 1]?.focus();
      } else {
        const arr = value.padEnd(6, " ").split("");
        arr[idx] = " ";
        onChange(arr.join("").trimEnd());
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const next = Math.min(pasted.length, 5);
    inputsRef.current[next]?.focus();
  }

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Code OTP à 6 chiffres">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] && value[idx] !== " " ? value[idx] : ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Chiffre ${idx + 1}`}
          className="text-center text-xl font-bold outline-none transition-all"
          style={{
            width: 44,
            height: 52,
            borderRadius: "var(--radius-md)",
            border: `2px solid ${value[idx] && value[idx] !== " " ? "var(--color-primary)" : "var(--color-border)"}`,
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
          }}
          onBlur={(e) => {
            if (!e.currentTarget.value) {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }
          }}
        />
      ))}
    </div>
  );
}
