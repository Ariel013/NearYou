import type { Provider, Category, ProviderPhoto, Review, OtpPurpose } from "@/lib/supabase/types";

export type { OtpPurpose };

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Provider base sans le champ location (hex WKB non utilisable côté client)
type ProviderBase = Omit<Provider, "location">;

export interface ProviderWithDistance extends ProviderBase {
  lat: number;
  lng: number;
  distance_km: number;
  categories: Category[];
  cover_photo: ProviderPhoto | null;
}

export interface ProviderFull extends ProviderBase {
  lat: number;
  lng: number;
  distance_km?: number;
  categories: Category[];
  photos: ProviderPhoto[];
  reviews: Review[];
  disabled_at: string | null;
}

export interface SearchFilters {
  lat: number;
  lng: number;
  radius_km: number;
  category_slug?: string;
  q?: string;
  sort?: "distance" | "rating" | "availability";
}

export interface ClaimResult {
  found: boolean;
  provider?: Provider;
}

export const MAX_RADIUS_KM = 50;
export const DEFAULT_RADIUS_KM = Number(process.env.NEXT_PUBLIC_DEFAULT_RADIUS_KM) || 5;
export const DEFAULT_LAT = Number(process.env.NEXT_PUBLIC_DEFAULT_LAT) || 6.3659;
export const DEFAULT_LNG = Number(process.env.NEXT_PUBLIC_DEFAULT_LNG) || 2.4183;
