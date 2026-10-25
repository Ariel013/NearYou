"use client";

import { Search, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSearchStore } from "@/store/useSearchStore";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Rechercher un service…" }: SearchBarProps) {
  const { query, setQuery } = useSearchStore();
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Sur la page d'accueil → naviguer vers /providers (query déjà dans le store)
    if (pathname === "/") {
      router.push("/providers");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="search-field relative flex items-center"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <Search
        size={18}
        className="absolute left-4 pointer-events-none"
        style={{ color: "var(--color-text-muted)" }}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Recherche de prestataires"
        className="w-full bg-transparent py-3 pl-11 pr-12 outline-none"
        style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full transition-opacity active:opacity-60"
          aria-label="Effacer la recherche"
        >
          <X size={16} style={{ color: "var(--color-text-muted)" }} />
        </button>
      )}
    </form>
  );
}
