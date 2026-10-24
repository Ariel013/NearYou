"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Map, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AppNav } from "@/components/shared/AppNav";
import { SearchBar } from "@/components/search/SearchBar";
import { ProviderList } from "@/components/providers/ProviderList";
import { ProviderSheet } from "@/components/providers/ProviderSheet";
import { MapViewDynamic } from "@/components/map/MapViewDynamic";
import { NavigationViewDynamic } from "@/components/map/NavigationViewDynamic";
import { useSearchStore } from "@/store/useSearchStore";
import { useProviders } from "@/hooks/useProviders";
import { useState } from "react";
import type { ProviderWithDistance } from "@/types";

interface NavTarget { name: string; lat: number; lng: number }

function ProvidersPageContent() {
  const searchParams = useSearchParams();
  const {
    position,
    radius,
    activeCategory,
    setActiveCategory,
    viewMode,
    setViewMode,
    query,
  } = useSearchStore();

  const [selectedProvider, setSelectedProvider] = useState<ProviderWithDistance | null>(null);
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);

  // Sync category from URL param
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setActiveCategory(cat);
  }, [searchParams, setActiveCategory]);

  const filters = useMemo(() => {
    if (!position) return null;
    return {
      lat: position.lat,
      lng: position.lng,
      radius_km: radius,
      category_slug: activeCategory ?? undefined,
      q: query || undefined,
      sort: "distance" as const,
    };
  }, [position, radius, activeCategory, query]);

  const { providers, isLoading } = useProviders(filters);

  // Quand un prestataire est sélectionné, centrer la carte sur lui
  const defaultCenter = position ?? { lat: 6.3659, lng: 2.4183 };
  const center = selectedProvider &&
    Number.isFinite(selectedProvider.lat) && Number.isFinite(selectedProvider.lng)
    ? { lat: selectedProvider.lat, lng: selectedProvider.lng }
    : defaultCenter;

  return (
    <main className="flex flex-col min-h-screen pb-20" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Sticky header with search + toggle */}
      <div
        className="sticky top-0 z-40 px-4 py-3 space-y-3"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <SearchBar placeholder="Rechercher un prestataire…" />

        {/* View toggle */}
        <div className="flex items-center justify-between">
          <div
            className="flex rounded-full p-1 gap-1"
            style={{ backgroundColor: "var(--color-border)" }}
          >
            {(["list", "map"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === mode ? "var(--color-surface)" : "transparent",
                  color: viewMode === mode ? "var(--color-primary)" : "var(--color-text-muted)",
                  boxShadow: viewMode === mode ? "var(--shadow-sm)" : "none",
                  fontSize: "var(--text-xs)",
                }}
                aria-pressed={viewMode === mode}
                aria-label={mode === "map" ? "Vue carte" : "Vue liste"}
              >
                {mode === "map" ? <Map size={14} /> : <List size={14} />}
                {mode === "map" ? "Carte" : "Liste"}
              </button>
            ))}
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            {isLoading ? "Chargement…" : `${providers.length} prestataire${providers.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Category chips */}
        <div className="overflow-x-auto pb-1 -mx-4 px-4">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setActiveCategory(null)}
              className="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: !activeCategory ? "var(--color-primary)" : "var(--color-surface)",
                color: !activeCategory ? "var(--color-on-primary)" : "var(--color-text-muted)",
                border: `1px solid ${!activeCategory ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              Tous
            </button>
            {[
              { slug: "menuiserie", name: "Menuiserie" },
              { slug: "plomberie", name: "Plomberie" },
              { slug: "electricite", name: "Électricité" },
              { slug: "menage", name: "Ménage" },
              { slug: "mecanique", name: "Mécanique" },
              { slug: "informatique", name: "Informatique" },
            ].map(({ slug, name }) => (
              <button
                key={slug}
                onClick={() => setActiveCategory(activeCategory === slug ? null : slug)}
                className="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeCategory === slug ? "var(--color-primary)" : "var(--color-surface)",
                  color: activeCategory === slug ? "var(--color-on-primary)" : "var(--color-text-muted)",
                  border: `1px solid ${activeCategory === slug ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <div className="relative" style={{ height: "42vh" }}>
          <MapViewDynamic
            center={center}
            providers={providers}
            selectedProviderId={selectedProvider?.id}
            onMarkerClick={setSelectedProvider}
            className="absolute inset-0 w-full h-full"
            interactive={!selectedProvider}
          />
        </div>
      ) : (
        <div className="px-4 py-4">
          <ProviderList
            providers={providers}
            isLoading={isLoading}
            onSelect={(id) => {
              const p = providers.find((x) => x.id === id);
              if (p) setSelectedProvider(p);
            }}
          />
        </div>
      )}

      {/* Radius slider */}
      <div
        className="px-5 py-3"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
            Rayon :
          </span>
          <input
            type="range"
            min={1}
            max={20}
            value={radius}
            onChange={(e) => useSearchStore.getState().setRadius(Number(e.target.value))}
            className="flex-1"
            aria-label="Rayon de recherche en km"
          />
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
            {radius} km
          </span>
        </div>
      </div>

      <ProviderSheet
        provider={selectedProvider}
        open={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onNavigate={(target) => {
          setSelectedProvider(null);
          setNavTarget(target);
        }}
      />

      {/* Navigation plein écran — rendu au niveau page pour dépasser le z-index du Sheet */}
      {navTarget && (
        <NavigationViewDynamic
          target={navTarget}
          onClose={() => setNavTarget(null)}
        />
      )}

      <AppNav />
    </main>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense>
      <ProvidersPageContent />
    </Suspense>
  );
}
