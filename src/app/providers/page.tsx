"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LocateFixed, Loader, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/shared/AppNav";
import { SearchBar } from "@/components/search/SearchBar";
import { ProviderList } from "@/components/providers/ProviderList";
import { ProviderPreview, ProviderSheet } from "@/components/providers/ProviderSheet";
import { MapViewDynamic } from "@/components/map/MapViewDynamic";
import { NavigationViewDynamic } from "@/components/map/NavigationViewDynamic";
import { ExploreSheet, type SheetSnap } from "@/components/explore/ExploreSheet";
import { CategoryChips, RadiusPicker, RADIUS_OPTIONS } from "@/components/explore/ExploreFilters";
import { useSearchStore } from "@/store/useSearchStore";
import { useProviders } from "@/hooks/useProviders";
import { useMediaQuery, DESKTOP_QUERY } from "@/hooks/useMediaQuery";
import { DEFAULT_LAT, DEFAULT_LNG, type ProviderWithDistance } from "@/types";

interface NavTarget { name: string; lat: number; lng: number }

/** Écart approximatif en km, suffisant pour décider d'un « chercher ici ». */
function roughKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = (a.lat - b.lat) * 111;
  const dLng = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

function ProvidersPageContent() {
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { position, setPosition, radius, setRadius, activeCategory, setActiveCategory, query } = useSearchStore();

  const [selectedProvider, setSelectedProvider] = useState<ProviderWithDistance | null>(null);
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("half");
  const [coveredPx, setCoveredPx] = useState(0);
  const [movedTo, setMovedTo] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Paramètres d'URL : catégorie depuis l'accueil, position depuis un lien partagé
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setActiveCategory(cat);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (searchParams.has("lat") && searchParams.has("lng") && Number.isFinite(lat) && Number.isFinite(lng)
      && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      setPosition({ lat, lng });
    }
  }, [searchParams, setActiveCategory, setPosition]);

  const searchCenter = position ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

  const filters = useMemo(() => ({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius_km: radius,
    category_slug: activeCategory ?? undefined,
    q: query || undefined,
    sort: "distance" as const,
  }), [searchCenter.lat, searchCenter.lng, radius, activeCategory, query]);

  const { providers, isLoading, error } = useProviders(filters);

  const mapCenter = selectedProvider && Number.isFinite(selectedProvider.lat) && Number.isFinite(selectedProvider.lng)
    ? { lat: selectedProvider.lat, lng: selectedProvider.lng }
    : searchCenter;

  const selectById = useCallback((id: string) => {
    const p = providers.find((x) => x.id === id);
    if (p) setSelectedProvider(p);
  }, [providers]);

  const handleUserMove = useCallback((c: { lat: number; lng: number }) => {
    setMovedTo(c);
  }, []);
  const showSearchHere = movedTo !== null && roughKm(movedTo, searchCenter) > Math.max(radius * 0.3, 0.5);

  function searchHere() {
    if (!movedTo) return;
    setSelectedProvider(null);
    setPosition(movedTo);
    setMovedTo(null);
  }

  function locateMe() {
    if (!navigator.geolocation) {
      toast.error("La localisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setSelectedProvider(null);
        setMovedTo(null);
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Position introuvable. Autorisez la localisation, ou déplacez la carte.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const widen = radius < RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]
    ? () => setRadius(RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1])
    : undefined;

  const countLabel = isLoading
    ? "Recherche…"
    : `${providers.length} prestataire${providers.length !== 1 ? "s" : ""} à moins de ${radius} km`;

  const list = (
    <ProviderList
      providers={providers}
      isLoading={isLoading}
      error={error}
      onSelect={selectById}
      selectedId={selectedProvider?.id}
      radiusKm={radius}
      onWiden={widen}
    />
  );

  return (
    <main className="explore" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* ─── Ordinateur : panneau de gauche ─── */}
      <aside className="explore-panel hidden lg:flex" aria-label="Recherche et résultats">
        <div className="space-y-3 border-b px-5 pt-5 pb-4" style={{ borderColor: "var(--color-border)" }}>
          <h1 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}>
            Explorer
          </h1>
          <SearchBar placeholder="Un métier, un nom…" />
          <CategoryChips active={activeCategory} onChange={setActiveCategory} />
          <RadiusPicker value={radius} onChange={setRadius} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {isDesktop && selectedProvider ? (
            <div className="px-2 py-1">
              <ProviderPreview
                key={selectedProvider.id}
                provider={selectedProvider}
                onClose={() => setSelectedProvider(null)}
                onNavigate={setNavTarget}
                showBack
              />
            </div>
          ) : (
            <>
              <p className="px-2 pb-2" aria-live="polite" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {countLabel}
              </p>
              {list}
            </>
          )}
        </div>
      </aside>

      {/* ─── Carte ─── */}
      <div className="explore-map">
        <MapViewDynamic
          center={mapCenter}
          providers={providers}
          selectedProviderId={selectedProvider?.id}
          onMarkerClick={setSelectedProvider}
          onUserMove={handleUserMove}
          paddingBottom={isDesktop ? 0 : coveredPx}
          className="absolute inset-0"
        />

        {/* Téléphone : recherche et catégories flottent sur la carte */}
        <div className="explore-topbar lg:hidden">
          <SearchBar placeholder="Un métier, un nom…" />
          <CategoryChips active={activeCategory} onChange={setActiveCategory} floating />
        </div>

        <div className="explore-map-actions">
          {showSearchHere && (
            <button type="button" onClick={searchHere} className="map-chip map-chip--strong">
              <RotateCw size={15} aria-hidden />
              Chercher dans cette zone
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          aria-label="Me localiser"
          className="map-chip explore-locate"
        >
          {locating ? <Loader size={16} className="animate-spin" aria-hidden /> : <LocateFixed size={16} aria-hidden />}
        </button>

        {/* Téléphone : résultats dans un panneau à tirer */}
        {!isDesktop && (
          <ExploreSheet
            snap={snap}
            onSnapChange={setSnap}
            onCoveredHeight={setCoveredPx}
            header={
              <div className="space-y-2 px-4 pb-3">
                <p className="font-semibold" aria-live="polite" style={{ fontSize: "var(--text-sm)" }}>
                  {countLabel}
                </p>
                <RadiusPicker value={radius} onChange={setRadius} />
              </div>
            }
          >
            {list}
          </ExploreSheet>
        )}
      </div>

      {!isDesktop && (
        <ProviderSheet
          provider={selectedProvider}
          open={!!selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onNavigate={(target) => {
            setSelectedProvider(null);
            setNavTarget(target);
          }}
        />
      )}

      {navTarget && (
        <NavigationViewDynamic target={navTarget} onClose={() => setNavTarget(null)} />
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
