"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface Category { id: string; name: string; slug: string }

interface AdminProviderFiltersProps {
  categories: Category[];
  currentCategory: string | null;
  currentQ: string | null;
}

export function AdminProviderFilters({ categories, currentCategory, currentQ }: AdminProviderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(currentQ ?? "");

  function navigate(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => { router.push(`?${next.toString()}`); });
  }

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ q: q.trim() || null }); }}
        className="relative"
      >
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, téléphone, adresse…"
          className="w-full rounded-2xl pl-9 pr-9 py-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={{
            fontSize: "var(--text-sm)",
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); navigate({ q: null }); }}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>
        )}
      </form>

      {/* Chips catégories */}
      <div className="overflow-x-auto pb-0.5 -mx-1 px-1">
        <div className="flex gap-1.5 w-max">
          <CategoryChip
            label="Toutes"
            active={!currentCategory}
            onClick={() => navigate({ category: null })}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={currentCategory === cat.slug}
              onClick={() =>
                navigate({ category: currentCategory === cat.slug ? null : cat.slug })
              }
            />
          ))}
        </div>
      </div>

      {isPending && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
          Chargement…
        </p>
      )}
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all"
      style={{
        backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
        color: active ? "white" : "var(--color-text-muted)",
        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
      }}
    >
      {label}
    </button>
  );
}
