"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Navigation, MapPin, Loader } from "lucide-react";
import { LngLatBounds, Marker, type GeoJSONSource } from "maplibre-gl";
import {
  createBrandMap,
  prefersReducedMotion,
  ROUTE_COLORS,
  webglSupported,
  type MapLibreMap,
} from "./brand-map";
import { createDestinationPin, createUserDot, setUserDotHeading } from "./ProviderMarker";
import { MapUnavailable } from "./MapUnavailable";

interface NavigationTarget {
  name: string;
  lat: number;
  lng: number;
}

interface NavigationViewProps {
  target: NavigationTarget;
  onClose: () => void;
}

interface RouteInfo {
  distanceM: number;
  durationS: number;
  coordinates: [number, number][]; // [lng, lat] GeoJSON
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function fmtTime(s: number): string {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function NavigationView({ target, onClose }: NavigationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFetchKeyRef = useRef("");
  const lastFetchTimeRef = useRef(0);
  const lastHeadingRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  // Composant chargé côté client seulement (ssr: false) : WebGL se teste au montage.
  const [mapUnavailable, setMapUnavailable] = useState(() => !webglSupported());
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(() =>
    navigator.geolocation ? null : "Géolocalisation non disponible sur cet appareil."
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [arrived, setArrived] = useState(false);

  // ─── Carte ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (mapUnavailable) return;
    let cancelled = false;
    createBrandMap({
      container: containerRef.current,
      center: { lat: target.lat, lng: target.lng },
      zoom: 15,
      tilt: true,
      showZoomControl: false,
      isCancelled: () => cancelled,
    })
      .then((map) => {
        if (!map) return;
        mapRef.current = map;
        new Marker({ element: createDestinationPin(target.name), anchor: "bottom" })
          .setLngLat([target.lng, target.lat])
          .addTo(map);
        map.once("load", () => {
          map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({
            id: "route-casing",
            type: "line",
            source: "route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": ROUTE_COLORS.casing, "line-width": 9, "line-opacity": 0.35 },
          });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": ROUTE_COLORS.line, "line-width": 5 },
          });
          setMapReady(true);
        });
      })
      .catch(() => {
        if (!cancelled) setMapUnavailable(true);
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── GPS temps réel ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setGpsError("Impossible d'obtenir votre position GPS."),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ─── Boussole / heading ───────────────────────────────────────────────────
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    // iOS : webkitCompassHeading (degrés depuis le Nord, sens horaire)
    const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof ios === "number" && !isNaN(ios)) {
      setHeading(ios);
      return;
    }
    // Android : alpha en mode absolu
    if (e.alpha !== null) {
      setHeading((360 - e.alpha!) % 360);
    }
  }, []);

  useEffect(() => {
    // La permission boussole a déjà été demandée dans le click handler (ContactActions / ProviderSheet)
    window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
    window.addEventListener("deviceorientation", handleOrientation as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
    };
  }, [handleOrientation]);

  // ─── Calcul itinéraire OSRM ───────────────────────────────────────────────
  const fetchRoute = useCallback(async (from: { lat: number; lng: number }) => {
    setRouteLoading(true);
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from.lng},${from.lat};${target.lng},${target.lat}` +
        `?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json() as {
        routes?: { geometry: { coordinates: [number, number][] }; legs: { distance: number; duration: number }[] }[];
      };
      if (data.routes?.[0]) {
        const r = data.routes[0];
        setRoute({ distanceM: r.legs[0].distance, durationS: r.legs[0].duration, coordinates: r.geometry.coordinates });
        if (r.legs[0].distance < 30) setArrived(true);
      }
    } catch { /* silencieux */ }
    finally { setRouteLoading(false); }
  }, [target.lat, target.lng]);

  // Re-calculer toutes les ~50 m ou toutes les 15 s
  useEffect(() => {
    if (!userPos) return;
    const key = `${userPos.lat.toFixed(4)},${userPos.lng.toFixed(4)}`; // ~11 m résolution
    const now = Date.now();
    const movedEnough = key !== lastFetchKeyRef.current;
    const enoughTime = now - lastFetchTimeRef.current > 15_000;
    if (!movedEnough && !enoughTime) return;
    lastFetchKeyRef.current = key;
    lastFetchTimeRef.current = now;
    fetchRoute(userPos);
  }, [userPos, fetchRoute]);

  // ─── Marker utilisateur + suivi carte ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !userPos) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userPos.lng, userPos.lat]);
    } else {
      userMarkerRef.current = new Marker({ element: createUserDot(heading) })
        .setLngLat([userPos.lng, userPos.lat])
        .addTo(map);
    }
    map.easeTo({
      center: [userPos.lng, userPos.lat],
      zoom: Math.max(map.getZoom(), 15),
      duration: prefersReducedMotion() ? 0 : 500,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, mapReady]);

  // Mise à jour du seul heading (sans bouger) — throttlé à 5°
  useEffect(() => {
    if (!mapReady || !userMarkerRef.current || heading === null) return;
    if (lastHeadingRef.current !== null && Math.abs(heading - lastHeadingRef.current) < 5) return;
    lastHeadingRef.current = heading;
    setUserDotHeading(userMarkerRef.current.getElement(), heading);
  }, [heading, mapReady]);

  // ─── Tracé de l'itinéraire ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !route || !userPos) return;
    const source = map.getSource<GeoJSONSource>("route");
    source?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: route.coordinates },
    });

    // Première fois : ajuster la vue pour voir tout l'itinéraire
    if (!arrived) {
      map.fitBounds(
        new LngLatBounds([userPos.lng, userPos.lat], [userPos.lng, userPos.lat]).extend([target.lng, target.lat]),
        { padding: 60, maxZoom: 16, duration: prefersReducedMotion() ? 0 : 800 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, mapReady]);

  // ─── UI ──────────────────────────────────────────────────────────────────
  // Rendue dans <body> : ouverte depuis la barre de contact (fixe, z-40), elle
  // resterait sinon prise sous la navigation de l'app.
  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-[999] flex flex-col"
      style={{
        height: "80vh",
        borderRadius: "20px 20px 0 0",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        backgroundColor: "var(--color-surface-sunk)",
      }}
    >

      {/* Handle */}
      <div className="flex justify-center pt-2 pb-1 flex-shrink-0" style={{ backgroundColor: "var(--color-primary)" }}>
        <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "oklch(0.990 0.004 240 / 0.4)" }} />
      </div>

      {/* Barre du haut */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          backgroundColor: "var(--color-primary)",
          boxShadow: "var(--shadow-md)",
          paddingTop: "4px",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={onClose}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-70"
          style={{ backgroundColor: "oklch(0.990 0.004 240 / 0.2)" }}
          aria-label="Fermer la navigation"
        >
          <X size={20} style={{ color: "var(--color-on-primary)" }} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate" style={{ color: "var(--color-on-primary)", fontFamily: "var(--font-display)", fontSize: "var(--text-base)" }}>
            {target.name}
          </p>
          {route && !arrived && (
            <p className="tabular" style={{ color: "var(--color-on-primary)", opacity: 0.85, fontSize: "var(--text-sm)" }}>
              {fmtDist(route.distanceM)} · {fmtTime(route.durationS)}
            </p>
          )}
          {arrived && <p className="font-medium" style={{ color: "var(--color-on-primary)", fontSize: "var(--text-sm)" }}>Vous êtes arrivé !</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {routeLoading
            ? <Loader size={20} style={{ color: "var(--color-on-primary)" }} className="animate-spin" />
            : <Navigation size={20} style={{ color: "var(--color-on-primary)" }} />
          }
        </div>
      </div>

      {/* Carte */}
      <div className="relative flex-1 min-h-0">
        {mapUnavailable ? (
          <MapUnavailable className="absolute inset-0" lat={target.lat} lng={target.lng} />
        ) : (
          <div ref={containerRef} className="absolute inset-0" />
        )}

        {gpsError && (
          <div
            className="absolute inset-x-4 top-3 rounded-2xl p-3 text-sm text-center z-10"
            style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
          >
            {gpsError}
          </div>
        )}

        {!userPos && !gpsError && (
          <div
            className="absolute inset-x-4 top-3 rounded-2xl p-3 text-sm text-center z-10 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-md)", color: "var(--color-text-muted)" }}
          >
            <Loader size={14} className="animate-spin" />
            Localisation GPS en cours…
          </div>
        )}
      </div>

      {/* Barre du bas — safe area iPhone */}
      <div
        className="flex-shrink-0 px-5"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-md)",
          paddingTop: "16px",
          paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
        }}
      >
        {arrived ? (
          <div className="flex items-center gap-3 py-1">
            <div className="rounded-full p-3" style={{ backgroundColor: "var(--color-success-light)" }}>
              <MapPin size={22} style={{ color: "var(--color-success)" }} />
            </div>
            <div>
              <p className="font-bold" style={{ fontSize: "var(--text-lg)", color: "var(--color-success)" }}>Vous êtes arrivé !</p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>{target.name}</p>
            </div>
          </div>
        ) : route ? (
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="tabular font-bold" style={{ fontSize: "var(--text-2xl)", color: "var(--color-text)" }}>
                {fmtDist(route.distanceM)}
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Temps estimé : {fmtTime(route.durationS)}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "var(--color-primary-light)" }}>
              <Navigation size={16} style={{ color: "var(--color-primary)" }} />
              <span style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)", fontWeight: 600 }}>En route</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3" style={{ color: "var(--color-text-muted)" }}>
            <Loader size={16} className="animate-spin" />
            <span style={{ fontSize: "var(--text-sm)" }}>Calcul de l&apos;itinéraire…</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
