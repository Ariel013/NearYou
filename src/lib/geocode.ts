import { distanceKm } from "@/lib/geo";

// Suggestions d'adresses et quartier d'un point, depuis Photon (OpenStreetMap).
// Appelé côté serveur seulement : le navigateur ne parle qu'à notre API, ce qui
// garde l'IP de l'usager chez nous et permet de changer de fournisseur sans
// toucher au client (voir ADR 0005).

const PHOTON_URL = "https://photon.komoot.io";
const USER_AGENT = "NearYou/0.1 (annuaire de prestataires, Benin et Cote d'Ivoire)";
const TIMEOUT_MS = 4000;

/** Seuls pays servis : les résultats du Togo, du Ghana ou du Nigeria sont écartés. */
const COUNTRIES = new Set(["BJ", "CI"]);

/** Du sud-ouest de la Côte d'Ivoire au nord-est du Bénin : borne grossière, affinée par le pays. */
const BBOX = "-8.7,4.2,3.9,12.5";

export interface AddressSuggestion {
  /** Ce que l'on reconnaît : la rue, le lieu repère, le quartier. */
  name: string;
  /** Où c'est : quartier, commune, ville. */
  context: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string | undefined>;
}

/** Arrondissements numérotés de Cotonou : moins parlants qu'un nom de quartier. */
const NUMBERED_DISTRICT = /^\d+\s*(e|è|ème|ᵉ)\s+arrondissement$/i;

function unique(parts: (string | undefined)[], exclude?: string): string[] {
  const seen = new Set<string>(exclude ? [exclude.toLowerCase()] : []);
  const out: string[] = [];
  for (const p of parts) {
    const v = p?.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

/** `named` : l'élément a déjà un nom (rue, lieu) ; un numéro d'arrondissement n'y ajoute rien. */
function placeParts(p: Record<string, string | undefined>, named = false): (string | undefined)[] {
  const numbered = !!p.district && NUMBERED_DISTRICT.test(p.district);
  const district = p.district && !(numbered && (named || p.locality)) ? p.district : undefined;
  return [p.locality, district, p.city ?? p.county];
}

async function photon(path: string, params: Record<string, string>): Promise<PhotonFeature[]> {
  const url = `${PHOTON_URL}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const json = (await res.json()) as { features?: PhotonFeature[] };
  return json.features ?? [];
}

function coords(f: PhotonFeature): { lat: number; lng: number } | null {
  const c = f.geometry?.coordinates;
  if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
  return { lng: c[0], lat: c[1] };
}

export async function suggestAddresses(q: string, near: { lat: number; lng: number }): Promise<AddressSuggestion[]> {
  const features = await photon("/api/", {
    q,
    lat: String(near.lat),
    lon: String(near.lng),
    bbox: BBOX,
    lang: "fr",
    limit: "12",
  });

  const out: AddressSuggestion[] = [];
  const seen = new Set<string>();
  for (const f of features) {
    const p = f.properties ?? {};
    const c = coords(f);
    if (!c || !p.name || !COUNTRIES.has(p.countrycode ?? "")) continue;
    const context = unique(placeParts(p, true), p.name).join(", ");
    const key = `${p.name}|${context}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: p.name, context, ...c });
  }
  // Photon mêle pertinence et proximité ; on fait primer la proximité par tranches
  // de 10 km (tri stable) : le Fidjrossé de Cotonou avant celui de Dangbo.
  const band = (x: AddressSuggestion) => Math.floor(distanceKm(near, x) / 10);
  return out.sort((a, b) => band(a) - band(b)).slice(0, 6);
}

/** « Fidjrossé, Cotonou » : le quartier du point, sans l'enseigne la plus proche. */
export async function placeLabel(at: { lat: number; lng: number }): Promise<string | null> {
  const features = await photon("/reverse", { lat: String(at.lat), lon: String(at.lng), lang: "fr", limit: "5" });
  const inScope = features.filter((f) => COUNTRIES.has(f.properties?.countrycode ?? ""));
  const best = inScope.find((f) => f.properties?.locality) ?? inScope[0];
  if (!best?.properties) return null;
  const label = unique(placeParts(best.properties)).slice(0, 3).join(", ");
  return label || null;
}
