export type OtpPurpose = "claim" | "review" | "login";

export type ContactType = "call" | "whatsapp" | "itinerary";

export type ReportReason =
  | "fiche_incorrecte"
  | "prestataire_inexistant"
  | "avis_abusif"
  | "contenu_inapproprie"
  | "doublon";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  parent_id: string | null;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  contact_phone: string;
  bio: string | null;
  location: unknown;
  address_label: string | null;
  zone_radius_km: number;
  available: boolean;
  verified_at: string | null;
  claimed_at: string | null;
  claimed_by_phone: string | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderCategory {
  provider_id: string;
  category_id: string;
}

export interface ProviderPhoto {
  id: string;
  provider_id: string;
  url: string;
  caption: string | null;
  is_cover: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  provider_id: string;
  reviewer_phone: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface OtpClaim {
  id: string;
  phone: string;
  provider_id: string | null;
  code: string;
  purpose: OtpPurpose;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  provider_id: string | null;
  review_id: string | null;
  reason: ReportReason;
  details: string | null;
  reporter_ip: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  provider_id: string;
  contact_type: ContactType;
  created_at: string;
}

export interface ProviderWithCategories extends Provider {
  categories: Category[];
  photos: ProviderPhoto[];
}
