"use client";

import { Search } from "lucide-react";
import { useSearchStore } from "@/store/useSearchStore";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Rechercher un service…" }: SearchBarProps) {
  const { query, setQuery } = useSearchStore();

  return (
    <div
      className="relative flex items-center"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <Search
        size={18}
        className="absolute left-4"
        style={{ color: "var(--color-text-muted)" }}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Recherche de prestataires"
        className="w-full bg-transparent py-3 pl-11 pr-4 outline-none"
        style={{
          fontSize: "var(--text-base)",
          color: "var(--color-text)",
        }}
      />
    </div>
  );
}
