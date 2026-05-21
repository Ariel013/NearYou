"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Navigation, MapPin, Loader } from "lucide-react";

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
  /** Coordonnées [lng, lat] au format GeoJSON retourné par OSRM */
  coordinates: [number, number][];
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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const routePolylineRef = useRef<import("leaflet").Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [arrived, setArrived] = useState(false);

  // ─── Initialisation de la carte Leaflet ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [target.lat, target.lng],
        zoom: 14,
        zoomControl: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Marker destination
      const destHtml = `
        <div style="
          width:40px;height:40px;border-radius:50% 50% 50% 0;
          background:#F5A623;transform:rotate(-45deg);
          border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
        "></div>`;
      const destIcon = L.divIcon({
        className: "",
        html: destHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
      L.marker([target.lat, target.lng], { icon: destIcon })
        .addTo(map)
        .bindTooltip(target.name, { permanent: true, direction: "top", offset: [0, -8] });

      setMapReady(true);
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Suivi GPS en temps réel ─────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setGpsError("Impossible d'obtenir votre position GPS."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ─── Calcul de l'itinéraire via OSRM (public) ───────────────────────────
  const fetchRoute = useCallback(
    async (from: { lat: number; lng: number }) => {
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
          setRoute({
            distanceM: r.legs[0].distance,
            durationS: r.legs[0].duration,
            coordinates: r.geometry.coordinates,
          });
          // Arrivée si < 30 m
          if (r.legs[0].distance < 30) setArrived(true);
        }
      } catch {
        // Silencieux : la carte reste lisible sans la polyline
      } finally {
        setRouteLoading(false);
      }
    },
    [target.lat, target.lng]
  );

  // Re-calculer l'itinéraire dès que la position change d'au moins ~100 m
  const lastFetchPos = useRef<string>("");
  useEffect(() => {
    if (!userPos) return;
    const key = `${userPos.lat.toFixed(3)},${userPos.lng.toFixed(3)}`;
    if (key === lastFetchPos.current) return;
    lastFetchPos.current = key;
    fetchRoute(userPos);
  }, [userPos, fetchRoute]);

  // ─── Mise à jour du marker utilisateur sur la carte ─────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userPos) return;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
      } else {
        const userHtml = `
          <div style="
            width:22px;height:22px;border-radius:50%;
            background:#1B6CA8;border:3px solid white;
            box-shadow:0 0 0 6px rgba(27,108,168,0.25);
          "></div>`;
        const userIcon = L.divIcon({
          className: "",
          html: userHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon })
          .addTo(map)
          .bindTooltip("Vous", { direction: "top", offset: [0, -14] });
      }

      // Suivre l'utilisateur
      map.setView([userPos.lat, userPos.lng], Math.max(map.getZoom(), 15));
    })();
  }, [userPos, mapReady]);

  // ─── Tracé de la polyline de l'itinéraire ───────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !route || !userPos) return;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      routePolylineRef.current?.remove();

      // OSRM renvoie [lng, lat] → Leaflet attend [lat, lng]
      const latLngs = route.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      routePolylineRef.current = L.polyline(latLngs, {
        color: "#1B6CA8",
        weight: 6,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Afficher tout l'itinéraire au premier tracé
      const bounds = L.latLngBounds([
        [userPos.lat, userPos.lng],
        [target.lat, target.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, mapReady]);

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Barre supérieure */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: "var(--color-primary)", boxShadow: "var(--shadow-md)" }}
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
          <p
            className="font-semibold text-white truncate"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)" }}
          >
            {target.name}
          </p>
          {route && !arrived && (
            <p className="text-white/80" style={{ fontSize: "var(--text-sm)" }}>
              {fmtDist(route.distanceM)} · {fmtTime(route.durationS)}
            </p>
          )}
          {arrived && (
            <p className="text-white font-medium" style={{ fontSize: "var(--text-sm)" }}>
              Vous êtes arrivé !
            </p>
          )}
        </div>

        {routeLoading ? (
          <Loader size={20} color="white" className="animate-spin flex-shrink-0" />
        ) : (
          <Navigation size={20} color="white" className="flex-shrink-0" />
        )}
      </div>

      {/* Carte */}
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Bannière GPS manquant */}
        {gpsError && (
          <div
            className="absolute inset-x-4 top-3 rounded-2xl p-3 text-sm text-center z-10"
            style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
          >
            {gpsError}
          </div>
        )}

        {/* Attente GPS */}
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

      {/* Barre inférieure — résumé itinéraire */}
      <div
        className="flex-shrink-0 px-5 py-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {arrived ? (
          <div className="flex items-center justify-center gap-3">
            <div
              className="rounded-full p-3"
              style={{ backgroundColor: "var(--color-success-light)" }}
            >
              <MapPin size={22} style={{ color: "var(--color-success)" }} />
            </div>
            <div>
              <p className="font-bold" style={{ fontSize: "var(--text-lg)", color: "var(--color-success)" }}>
                Vous êtes arrivé !
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Destination : {target.name}
              </p>
            </div>
          </div>
        ) : route ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold" style={{ fontSize: "var(--text-2xl)", color: "var(--color-text)" }}>
                {fmtDist(route.distanceM)}
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Temps estimé : {fmtTime(route.durationS)}
              </p>
            </div>
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: "var(--color-primary-light)" }}
            >
              <Navigation size={16} style={{ color: "var(--color-primary)" }} />
              <span style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                En route
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            <Loader size={16} className="animate-spin" />
            <span style={{ fontSize: "var(--text-sm)" }}>Calcul de l'itinéraire…</span>
          </div>
        )}
      </div>
    </div>
  );
}
