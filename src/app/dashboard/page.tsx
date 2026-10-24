"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppNav } from "@/components/shared/AppNav";
import { StarRating } from "@/components/shared/StarRating";
import { ProviderForm } from "@/components/forms/ProviderForm";
import { useAuthStore } from "@/store/useAuthStore";
import type { ProviderFull, ApiResponse, PublicReview } from "@/types";
import type { ProviderFormValues } from "@/components/forms/ProviderForm";
import type { Contact } from "@/lib/supabase/types";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, providerId, logout } = useAuthStore();
  const [provider, setProvider] = useState<ProviderFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState<{ contacts: Contact[] }>({ contacts: [] });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/claim");
      return;
    }
    if (providerId) loadProvider(providerId);
  }, [isAuthenticated, providerId, router]);

  async function loadProvider(id: string) {
    setIsLoading(true);
    const res = await fetch(`/api/providers/${id}`);
    const json: ApiResponse<ProviderFull> = await res.json();
    if (json.data) setProvider(json.data);
    setIsLoading(false);
  }

  async function signOut() {
    await fetch("/api/claim/session", { method: "DELETE" }).catch(() => null);
    logout();
  }

  // Session serveur absente ou expirée : l'état local ne fait plus foi
  function endSession(message: string | null) {
    logout();
    toast.error(message ?? "Session expirée");
    router.replace("/claim");
  }

  async function toggleAvailability(val: boolean) {
    if (!provider) return;
    const res = await fetch(`/api/providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: val }),
    });
    const json: ApiResponse<unknown> = await res.json();
    if (res.status === 401) {
      endSession(json.error);
    } else if (json.error) {
      toast.error(json.error);
    } else {
      setProvider((p) => p ? { ...p, available: val } : p);
      toast.success(val ? "Vous êtes maintenant disponible" : "Vous êtes maintenant occupé");
    }
  }

  async function handleUpdateProfile(data: ProviderFormValues) {
    if (!provider) return;
    const res = await fetch(`/api/providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        bio: data.bio,
        address_label: data.address_label,
        zone_radius_km: data.zone_radius_km,
      }),
    });
    const json: ApiResponse<unknown> = await res.json();
    if (res.status === 401) {
      endSession(json.error);
    } else if (json.error) {
      toast.error(json.error);
    } else {
      toast.success("Fiche mise à jour");
      setEditing(false);
      if (providerId) loadProvider(providerId);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  const callCount = stats.contacts.filter((c) => c.contact_type === "call").length;
  const waCount = stats.contacts.filter((c) => c.contact_type === "whatsapp").length;

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "var(--color-bg)" }}>
      <header
        className="sticky top-0 z-40 px-5 py-4"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <h1
            className="font-bold"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}
          >
            Mon tableau de bord
          </h1>
          <button
            onClick={async () => { await signOut(); router.push("/"); }}
            style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {provider && (
          <>
            {/* Profile card */}
            <section
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-md)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold" style={{ fontSize: "var(--text-base)" }}>
                  {provider.name}
                </h2>
                <StarRating rating={provider.avg_rating} count={provider.review_count} size="sm" />
              </div>

              {/* Availability toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  id="availability"
                  checked={provider.available}
                  onCheckedChange={toggleAvailability}
                />
                <Label htmlFor="availability">
                  {provider.available ? "Disponible" : "Occupé"}
                </Label>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {editing ? "Annuler la modification" : "Modifier ma fiche"}
              </button>
            </section>

            {/* Edit form */}
            {editing && (
              <section
                className="rounded-2xl p-5"
                style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
              >
                <ProviderForm
                  defaultValues={{
                    name: provider.name,
                    contact_phone: provider.contact_phone,
                    bio: provider.bio ?? "",
                    address_label: provider.address_label ?? "",
                    zone_radius_km: provider.zone_radius_km,
                    category_ids: provider.categories?.map((c) => c.slug) ?? [],
                  }}
                  onSubmit={handleUpdateProfile}
                  submitLabel="Mettre à jour"
                />
              </section>
            )}

            {/* Stats */}
            <section>
              <h2 className="mb-3 font-semibold" style={{ fontSize: "var(--text-base)" }}>Statistiques</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Appels", value: callCount },
                  { label: "WhatsApp", value: waCount },
                  { label: "Avis reçus", value: provider.review_count },
                  { label: "Note moy.", value: provider.avg_rating.toFixed(1) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4 text-center"
                    style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
                  >
                    <p className="font-bold text-2xl" style={{ color: "var(--color-primary)" }}>{value}</p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            {provider.reviews?.length > 0 && (
              <section>
                <h2 className="mb-3 font-semibold" style={{ fontSize: "var(--text-base)" }}>Mes avis</h2>
                <ul className="space-y-3">
                  {provider.reviews.map((r: PublicReview) => (
                    <li
                      key={r.id}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
                    >
                      <div className="flex items-center justify-between">
                        <StarRating rating={r.rating} size="sm" />
                        <span style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-2" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                          {r.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <AppNav />
    </main>
  );
}
