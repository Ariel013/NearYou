import { z } from "zod";

export const otpSendSchema = z.object({
  phone: z.string().min(8).max(20),
  provider_id: z.string().uuid().optional(),
  purpose: z.enum(["claim", "review", "login"]),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6).regex(/^\d{6}$/),
  purpose: z.enum(["claim", "review", "login"]),
});

export const providerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  contact_phone: z.string().min(8, "Numéro invalide").max(20),
  bio: z.string().max(500).optional(),
  address_label: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zone_radius_km: z.number().int().min(1).max(100).default(5),
  available: z.boolean().default(true),
  category_ids: z.array(z.string().uuid()).min(1, "Sélectionnez au moins une catégorie"),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  reviewer_phone: z.string().min(8).max(20),
});

export const reportSchema = z.object({
  reason: z.enum([
    "fiche_incorrecte",
    "prestataire_inexistant",
    "avis_abusif",
    "contenu_inapproprie",
    "doublon",
  ]),
  details: z.string().max(500).optional(),
});

export const contactEventSchema = z.object({
  contact_type: z.enum(["call", "whatsapp", "itinerary"]),
});

export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type ProviderInput = z.infer<typeof providerSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
