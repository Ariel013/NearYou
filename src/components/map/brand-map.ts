"use client";

// Socle commun des cartes : MapLibre + tuiles vectorielles OpenFreeMap
// (gratuites, sans clé), restylées aux couleurs de la charte. ADR 0004.
// Ce module n'est chargé que côté client, via des composants importés
// dynamiquement (ssr: false).

import {
  AttributionControl,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type LayerSpecification,
  type StyleSpecification,
} from "maplibre-gl";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Worker servi depuis public/ (copié par scripts/copy-maplibre-worker.mjs).
setWorkerUrl("/maplibre-gl-worker.mjs");

// Palette de la carte. MapLibre ne lit pas l'OKLCH : ce sont les jetons de
// globals.css convertis en hexadécimal.
const PALETTE = {
  land: "#f4efe6",
  residential: "#efe7da",
  park: "#dde6cf",
  water: "#9cc3e6",
  waterLabel: "#2f5f8a",
  building: "#e6dccb",
  building3d: "#e2d4bd",
  roadMinor: "#fffdf8",
  roadCasing: "#e1d6c4",
  roadMajor: "#fbe6bd",
  roadMajorCasing: "#e5c58a",
  motorway: "#f5c978",
  motorwayCasing: "#d6a24c",
  rail: "#cbbfac",
  boundary: "#b8ad9b",
  label: "#3a3f4a",
  labelMuted: "#6b6359",
  halo: "#f7f3ec",
};

/** Tracé d'itinéraire : bleu lagune et bleu lagune profond, en hexadécimal (MapLibre ne lit pas l'OKLCH). */
export const ROUTE_COLORS = { line: "#0f69a6", casing: "#084b79" } as const;

// Couches retirées : relief raster des petits zooms (data inutile) et points
// d'intérêt génériques, qui noieraient les épingles des prestataires.
const DROPPED_LAYERS = new Set([
  "natural_earth", "poi_r20", "poi_r7", "poi_r1",
  // Cartouches routiers : filtres du style amont invalides (avertissements), jamais affichés
  "highway-shield-non-us", "highway-shield-us-interstate", "road_shield_us",
]);

function paintFor(layer: LayerSpecification): Record<string, unknown> {
  const id = layer.id;
  if (id === "background") return { "background-color": PALETTE.land };
  if (id === "landuse_residential") return { "fill-color": PALETTE.residential };
  if (id === "park" || id.startsWith("landcover_wood") || id.startsWith("landcover_grass")) {
    return { "fill-color": PALETTE.park, "fill-opacity": 0.8 };
  }
  if (id === "park_outline") return { "line-color": PALETTE.park };
  if (id === "water") return { "fill-color": PALETTE.water };
  if (layer.type === "line" && id.startsWith("waterway")) return { "line-color": PALETTE.water };
  if (id === "building") return { "fill-color": PALETTE.building, "fill-outline-color": PALETTE.roadCasing };
  if (id === "building-3d") {
    return { "fill-extrusion-color": PALETTE.building3d, "fill-extrusion-opacity": 0.9 };
  }
  if (layer.type === "line" && /(rail)/.test(id)) return { "line-color": PALETTE.rail };
  if (layer.type === "line" && id.startsWith("boundary")) return { "line-color": PALETTE.boundary };
  if (layer.type === "line" && /(road|bridge|tunnel)_/.test(id)) {
    const casing = id.endsWith("_casing");
    if (/motorway/.test(id)) return { "line-color": casing ? PALETTE.motorwayCasing : PALETTE.motorway };
    if (/(trunk|primary|secondary|tertiary|_link)/.test(id)) {
      return { "line-color": casing ? PALETTE.roadMajorCasing : PALETTE.roadMajor };
    }
    return { "line-color": casing ? PALETTE.roadCasing : PALETTE.roadMinor };
  }
  if (layer.type === "symbol") {
    if (id.startsWith("water")) return { "text-color": PALETTE.waterLabel, "text-halo-color": PALETTE.halo };
    const muted = id.startsWith("highway") || id === "airport" || id === "poi_transit";
    return {
      "text-color": muted ? PALETTE.labelMuted : PALETTE.label,
      "text-halo-color": PALETTE.halo,
      "text-halo-width": 1.25,
    };
  }
  return {};
}

let stylePromise: Promise<StyleSpecification> | null = null;

/** Style OpenFreeMap « liberty » recoloré ; téléchargé une fois par session. */
function loadBrandStyle(): Promise<StyleSpecification> {
  stylePromise ??= fetch(STYLE_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Style de carte indisponible (${res.status})`);
      return res.json() as Promise<StyleSpecification>;
    })
    .then((style) => {
      const layers = style.layers
        .filter((l) => !DROPPED_LAYERS.has(l.id))
        .map((l) => {
          const paint = paintFor(l);
          if (Object.keys(paint).length === 0) return l;
          return { ...l, paint: { ...(("paint" in l && l.paint) || {}), ...paint } } as LayerSpecification;
        });
      const sources = { ...style.sources };
      delete sources.ne2_shaded;
      return { ...style, sources, layers };
    })
    .catch((err) => {
      stylePromise = null; // un échec réseau ne se met pas en cache
      throw err;
    });
  return stylePromise;
}

export function webglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Vue inclinée par défaut sur grand écran ; à plat sur téléphone (data, batterie). */
export function defaultTilt(): boolean {
  return window.matchMedia("(min-width: 1024px)").matches;
}

export const TILT_PITCH = 55;

interface CreateBrandMapOptions {
  container: HTMLElement;
  center: { lat: number; lng: number };
  zoom: number;
  tilt?: boolean;
  /** Défilement de page prioritaire : la carte se manipule à deux doigts / Ctrl. */
  cooperative?: boolean;
  showZoomControl?: boolean;
  /** Vrai si le composant a été démonté pendant le chargement du style. */
  isCancelled?: () => boolean;
}

export async function createBrandMap({
  container,
  center,
  zoom,
  tilt = false,
  cooperative = false,
  showZoomControl = true,
  isCancelled = () => false,
}: CreateBrandMapOptions): Promise<MapLibreMap | null> {
  const style = await loadBrandStyle();
  // Ne jamais créer puis détruire une carte sur un conteneur qu'une autre
  // instance utilise (double montage de React en développement) : sa
  // destruction retire les classes du conteneur partagé.
  if (isCancelled()) return null;
  const map = new MapLibreMap({
    container,
    style,
    center: [center.lng, center.lat],
    zoom,
    pitch: tilt ? TILT_PITCH : 0,
    maxPitch: 65,
    attributionControl: false,
    cooperativeGestures: cooperative,
    fadeDuration: 150,
  });
  map.addControl(new AttributionControl({ compact: true }), "bottom-right");
  if (showZoomControl) {
    map.addControl(new NavigationControl({ showCompass: false }), "top-left");
  }
  map.once("style.load", () => setBuildingsRelief(map, tilt));
  // Crédits repliés en icône dès le départ : dépliés, ils mangent une petite carte.
  map.once("load", () => {
    container.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
  });
  return map;
}

/** Bâtiments en relief en vue inclinée ; à plat, simple emprise au sol (le
 *  style n'a pas de couche plate au-delà du zoom 14). */
export function setBuildingsRelief(map: MapLibreMap, on: boolean) {
  if (!map.getLayer("building-3d")) return;
  map.setPaintProperty("building-3d", "fill-extrusion-height", on ? ["get", "render_height"] : 0);
  map.setPaintProperty("building-3d", "fill-extrusion-base", on ? ["get", "render_min_height"] : 0);
}

export function setTilt(map: MapLibreMap, on: boolean) {
  setBuildingsRelief(map, on);
  map.easeTo({
    pitch: on ? TILT_PITCH : 0,
    bearing: on ? map.getBearing() : 0,
    duration: prefersReducedMotion() ? 0 : 600,
  });
}

export type { MapLibreMap };
