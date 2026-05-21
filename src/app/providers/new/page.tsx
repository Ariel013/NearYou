"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Locate } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { ProviderForm } from "@/components/forms/ProviderForm";
import type { ProviderFormValues } from "@/components/forms/ProviderForm";
import type { ApiResponse } from "@/types";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/types";

function NewProviderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPhone = searchParams.get("phone") ?? "";

  const [gpsLoading, setGpsLoading] = useState(true);
  const [initialPos, setInitialPos] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInitialPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  async function handleSubmit(data: ProviderFormValues) {
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        contact_phone: data.contact_phone,
        bio: data.bio,
        address_label: data.address_label,
        lat: data.lat,
        lng: data.lng,
        zone_radius_km: data.zone_radius_km,
        available: data.available,
        category_slugs: data.category_ids, // slugs → API les résout en UUIDs
      }),
    });

    const json: ApiResponse<{ id: string }> = await res.json();

    if (json.error) {
      if (res.status === 409) {
        toast.error(json.error, {
          description: "Cliquez sur 'C'est ma fiche' depuis la fiche existante.",
          duration: 6000,
        });
      } else {
        toast.error(json.error);
      }
      return;
    }

    toast.success("Fiche créée avec succès !");
    router.push(`/providers/${json.data?.id}`);
  }

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "var(--color-bg)" }}>
      <header
        className="sticky top-0 z-40 px-5 py-4"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)" }}
        >
          Ajouter un prestataire
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Sans compte requis — accessible à tous
        </p>
      </header>

      <div className="px-5 py-6">
        {gpsLoading ? (
          <div className="flex flex-col items-center gap-3 py-16" style={{ color: "var(--color-text-muted)" }}>
            <Locate size={28} className="animate-pulse" style={{ color: "var(--color-primary)" }} />
            <p style={{ fontSize: "var(--text-sm)" }}>Détection de votre position…</p>
          </div>
        ) : (
          <ProviderForm
            defaultValues={{ contact_phone: defaultPhone, lat: initialPos.lat, lng: initialPos.lng }}
            onSubmit={handleSubmit}
            submitLabel="Créer la fiche"
          />
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default function NewProviderPage() {
  return (
    <Suspense>
      <NewProviderPageContent />
    </Suspense>
  );
}
