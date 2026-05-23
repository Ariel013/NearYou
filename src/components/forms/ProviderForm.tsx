"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/components/search/CategoryGrid";
import { CountryPhoneInput } from "@/components/claim/CountryPhoneInput";
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_RADIUS_KM } from "@/types";

const LocationPickerDynamic = dynamic(
  () => import("@/components/map/LocationPicker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-gray-100" /> }
);

// Inline schema with required defaults to avoid optional-vs-required resolver conflicts
const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  contact_phone: z.string().min(8, "Numéro invalide").max(20),
  bio: z.string().max(500).optional(),
  address_label: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zone_radius_km: z.number().int().min(1).max(100),
  available: z.boolean(),
  category_ids: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie"),
});

type FormValues = z.infer<typeof formSchema>;

interface ProviderFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  submitLabel?: string;
}

export function ProviderForm({ defaultValues, onSubmit, submitLabel = "Enregistrer" }: ProviderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      zone_radius_km: DEFAULT_RADIUS_KM,
      available: true,
      category_ids: [],
      ...defaultValues,
    },
  });

  const selectedCategories = watch("category_ids") ?? [];
  const zoneRadius = watch("zone_radius_km") ?? 5;
  const lat = watch("lat");
  const lng = watch("lng");

  function toggleCategory(slug: string) {
    const current = selectedCategories;
    const next = current.includes(slug) ? current.filter((c) => c !== slug) : [...current, slug];
    setValue("category_ids", next, { shouldValidate: true });
  }

  async function handleFormSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom complet *</Label>
        <Input id="name" {...register("name")} placeholder="Jean Dupont" aria-invalid={!!errors.name} />
        {errors.name && <p style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>{errors.name.message}</p>}
      </div>

      {/* Phone */}
      <CountryPhoneInput
        id="contact_phone"
        onChange={(e164) => setValue("contact_phone", e164, { shouldValidate: true })}
        error={errors.contact_phone?.message}
      />

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">Description (facultatif)</Label>
        <textarea
          id="bio"
          {...register("bio")}
          rows={3}
          placeholder="Décrivez votre activité, votre expérience…"
          className="w-full resize-none px-3 py-2 outline-none transition-colors"
          style={{
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            fontSize: "var(--text-sm)",
          }}
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>Catégories *</Label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(({ slug, name }) => {
            const isSelected = selectedCategories.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleCategory(slug)}
                className="rounded-xl px-2 py-2 text-center transition-all"
                style={{
                  border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                  backgroundColor: isSelected ? "var(--color-primary-light)" : "var(--color-surface)",
                  color: isSelected ? "var(--color-primary)" : "var(--color-text-muted)",
                  fontSize: "var(--text-xs)",
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
        {errors.category_ids && (
          <p style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>
            {errors.category_ids.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address_label">Adresse (facultatif)</Label>
        <Input id="address_label" {...register("address_label")} placeholder="Quartier Gbèdjromèdji, Cotonou" />
      </div>

      {/* Location picker */}
      <div className="space-y-2">
        <Label>Position sur la carte *</Label>
        <LocationPickerDynamic
          initialLat={lat}
          initialLng={lng}
          onChange={({ lat: newLat, lng: newLng }) => {
            setValue("lat", newLat, { shouldValidate: true });
            setValue("lng", newLng, { shouldValidate: true });
          }}
        />
      </div>

      {/* Zone radius */}
      <div className="space-y-1.5">
        <Label htmlFor="zone_radius_km">Rayon d&apos;intervention : {zoneRadius} km</Label>
        <input
          id="zone_radius_km"
          type="range"
          min={1}
          max={50}
          {...register("zone_radius_km", { valueAsNumber: true })}
          className="w-full"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}

// Export type alias for external usage
export type { FormValues as ProviderFormValues };
