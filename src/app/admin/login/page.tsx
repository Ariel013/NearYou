"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin/reports";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Erreur de connexion");
          return;
        }

        router.push(redirect);
        router.refresh();
      } catch {
        setError("Erreur réseau. Réessayez.");
      }
    });
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6"
        style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-md)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <Shield size={28} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="text-center">
            <h1
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-text)" }}
            >
              Administration
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              GéoService
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                aria-describedby={error ? "login-error" : undefined}
                style={{ borderColor: error ? "var(--color-error)" : undefined, paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword
                  ? <EyeOff size={16} style={{ color: "var(--color-text-muted)" }} />
                  : <Eye     size={16} style={{ color: "var(--color-text-muted)" }} />
                }
              </button>
            </div>
            {error && (
              <p id="login-error" style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full rounded-full py-3 font-medium"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            disabled={!password || isPending}
            aria-label="Se connecter à l'administration"
          >
            {isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
