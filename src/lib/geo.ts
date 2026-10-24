/**
 * Décode une chaîne hex WKB / EWKB PostGIS en coordonnées {lat, lng}.
 * Fonctionne avec et sans SRID, en little-endian et big-endian.
 * Supabase sérialise les colonnes GEOGRAPHY en EWKB — pas en GeoJSON.
 */
export function parseWkbPoint(hex: unknown): { lat: number; lng: number } | null {
  if (typeof hex !== "string" || hex.length < 34) return null;

  const isLE = hex.slice(0, 2) === "01";
  // Bit SRID (0x20000000) : dans le 4e octet du champ type en little-endian → position 8
  const hasSrid = isLE
    ? parseInt(hex.slice(8, 10), 16) === 0x20
    : parseInt(hex.slice(2, 4), 16) === 0x20;

  const xOffset = hasSrid ? 18 : 10; // (1 byte order + 4 type + 4 SRID?) × 2 hex chars
  if (hex.length < xOffset + 32) return null;

  function hexToDouble(h: string): number {
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
    return new DataView(bytes.buffer).getFloat64(0, isLE);
  }

  const lng = hexToDouble(hex.slice(xOffset, xOffset + 16));       // X = longitude
  const lat = hexToDouble(hex.slice(xOffset + 16, xOffset + 32));  // Y = latitude
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\+\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}

export function buildWaLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}`;
}

/** Distance à vol d'oiseau en km (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Le point dans l'appli de cartes du téléphone (Google Maps, ou Plans sur iPhone via le lien universel). */
export function buildMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function buildOsmDirections(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/directions?to=${lat},${lng}`;
}
