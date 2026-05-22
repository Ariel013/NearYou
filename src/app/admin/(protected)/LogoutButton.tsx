"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-colors"
      style={{
        backgroundColor: "var(--color-error-light)",
        color: "var(--color-error)",
        fontSize: "var(--text-xs)",
        opacity: isLoading ? 0.6 : 1,
      }}
      aria-label="Se déconnecter"
    >
      <LogOut size={14} />
      {isLoading ? "…" : "Déconnexion"}
    </button>
  );
}
