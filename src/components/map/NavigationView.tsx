"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Navigation, MapPin, Loader, Compass } from "lucide-react";

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

/** Marker utilisateur : point bleu + cône directionnel si heading connu */
function userMarkerHtml(heading: number | null): string {
  const dot = `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#1B6CA8;border:3px solid white;
    box-shadow:0 0 0 5px rgba(27,108,168,0.25);
    position:absolute;top:50%;left:50%;
    transform:translate(-50%,-50%);
  "></div>`;

  if (heading === null) {
    return `<div style="width:40px;height:40px;position:relative;">${dot}</div>`;
  }

  const cone = `<div style="
    position:absolute;top:-6px;left:50%;
    transform:translateX(-50%);
    width:0;height:0;
    border-left:10px solid transparent;
    border-right:10px solid transparent;
    border-bottom:22px solid rgba(27,108,168,0.5);
  "></div>`;

  return `<div style="width:40px;height:40px;position:relative;transform:rotate(${heading}deg);">
    ${cone}${dot}
  </div>`;
}

export function NavigationView({ target, onClose }: NavigationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const routePolylineRef = useRef<import("leaflet").Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFetchKeyRef = useRef("");
  const lastFetchTimeRef = useRef(0);
  const lastHeadingRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [needsCompassPerm, setNeedsCompassPerm] = useState(false);

  // ─── Carte Leaflet ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [target.lat, target.lng],
        zoom: 15,
        zoomControl: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Marker destination (épingle ambre)
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:44px;position:relative;display:flex;
          flex-direction:column;align-items:center;">
          <div style="
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            background:#F5A623;transform:rotate(-45deg);
            border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);
          "></div>
        </div>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      });
      L.marker([target.lat, target.lng], { icon: destIcon })
        .addTo(map)
        .bindTooltip(target.name, { permanent: true, direction: "top", offset: [0, -46] });

      setMapReady(true);
    })();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── GPS temps réel ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Géolocalisation non disponible sur cet appareil.");
      return;
    }
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
    // iOS 13+ : permission requise via geste utilisateur
    if (typeof (DeviceOrientationEvent as { requestPermission?: unknown }).requestPermission === "function") {
      setNeedsCompassPerm(true);
      return;
    }
    // Android / autres : pas de permission nécessaire
    window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
    window.addEventListener("deviceorientation", handleOrientation as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
    };
  }, [handleOrientation]);

  async function requestCompassPermission() {
    try {
      const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
      if (perm === "granted") {
        setNeedsCompassPerm(false);
        window.addEventListener("deviceorientation", handleOrientation as EventListener, true);
      }
    } catch {
      setNeedsCompassPerm(false);
    }
  }

  // ─── Calcul itinéraire OSRM ───────────────────────────────────────────────
  const fetchRoute = useCallback(async (from: { lat: number; lng: number }) => {
    setRouteLoading(true);
    // Supprimer l'ancienne polyline pendant le recalcul
    routePolylineRef.current?.remove();
    routePolylineRef.current = null;
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
    if (!mapReady || !mapRef.current || !userPos) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;
      const html = userMarkerHtml(heading);
      const icon = L.divIcon({ className: "", html, iconSize: [40, 40], iconAnchor: [20, 20] });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
        userMarkerRef.current.setIcon(icon);
      } else {
        userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon })
          .addTo(map)
          .bindTooltip("Vous", { direction: "top", offset: [0, -22] });
      }

      map.setView([userPos.lat, userPos.lng], Math.max(map.getZoom(), 15), { animate: true });
    })();
  }, [userPos, mapReady, heading]);

  // Mise à jour du seul heading (sans bouger) — throttlé à 5°
  useEffect(() => {
    if (!mapReady || !userMarkerRef.current || heading === null) return;
    if (lastHeadingRef.current !== null && Math.abs(heading - lastHeadingRef.current) < 5) return;
    lastHeadingRef.current = heading;
    (async () => {
      const L = (await import("leaflet")).default;
      const icon = L.divIcon({ className: "", html: userMarkerHtml(heading), iconSize: [40, 40], iconAnchor: [20, 20] });
      userMarkerRef.current?.setIcon(icon);
    })();
  }, [heading, mapReady]);

  // ─── Tracé polyline ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !route || !userPos) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      routePolylineRef.current?.remove();
      const latLngs = route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      routePolylineRef.current = L.polyline(latLngs, {
        color: "#1B6CA8",
        weight: 6,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Première fois : ajuster la vue pour voir tout l'itinéraire
      if (!arrived) {
        map.fitBounds(
          L.latLngBounds([[userPos.lat, userPos.lng], [target.lat, target.lng]]),
          { padding: [60, 60], maxZoom: 16 }
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, mapReady]);

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    // z-[999] > BottomNav z-50 → la nav s'affiche toujours au premier plan
    <div className="fixed inset-0 z-[999] flex flex-col" style={{ backgroundColor: "#f0f0f0" }}>

      {/* Barre du haut */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          backgroundColor: "var(--color-primary)",
          boxShadow: "var(--shadow-md)",
          paddingTop: "max(env(safe-area-inset-top), 12px)",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={onClose}
          className="rounded-full p-2 flex-shrink-0 transition-opacity active:opacity-70"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          aria-label="Fermer la navigation"
        >
          <X size={20} color="white" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)" }}>
            {target.name}
          </p>
          {route && !arrived && (
            <p className="text-white/80" style={{ fontSize: "var(--text-sm)" }}>
              {fmtDist(route.distanceM)} · {fmtTime(route.durationS)}
            </p>
          )}
          {arrived && <p className="text-white font-medium" style={{ fontSize: "var(--text-sm)" }}>Vous êtes arrivé !</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bouton boussole iOS */}
          {needsCompassPerm && (
            <button
              onClick={requestCompassPermission}
              className="rounded-full p-2 transition-opacity active:opacity-70"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              aria-label="Activer la boussole"
            >
              <Compass size={18} color="white" />
            </button>
          )}
          {routeLoading
            ? <Loader size={20} color="white" className="animate-spin" />
            : <Navigation size={20} color="white" />
          }
        </div>
      </div>

      {/* Carte */}
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="absolute inset-0" />

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
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
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
              <p className="font-bold" style={{ fontSize: "var(--text-2xl)", color: "var(--color-text)" }}>
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
            <span style={{ fontSize: "var(--text-sm)" }}>Calcul de l'itinéraire…</span>
          </div>
        )}
      </div>
    </div>
  );
}
