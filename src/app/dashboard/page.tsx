"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, LogOut, MessageCircle, Navigation, Phone, Share2, Star, Store } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AppNav } from "@/components/shared/AppNav";
import { ProviderForm } from "@/components/forms/ProviderForm";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ContactChart } from "@/components/dashboard/ContactChart";
import { useAuthStore } from "@/store/useAuthStore";
import type { ProviderFull, ApiResponse, PublicReview } from "@/types";
import type { ProviderFormValues } from "@/components/forms/ProviderForm";
import type { ContactDay, ContactStats } from "@/app/api/providers/[id]/contacts/route";

function sum(days: ContactDay[]) {
  return days.reduce(
    (acc, d) => ({ call: acc.call + d.call, whatsapp: acc.whatsapp + d.whatsapp, itinerary: acc.itinerary + d.itinerary }),
    { call: 0, whatsapp: 0, itinerary: 0 }
  );
}

/** Espace sans session : on dit pourquoi, et quoi faire. */
function NoSession() {
  return (
    <main className="dashboard" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="dashboard-layout">
        <section className="max-w-[52ch] space-y-4 py-10">
          <Store size={28} style={{ color: "var(--color-accent-strong)" }} aria-hidden />
          <h1 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)" }}>
            Votre espace prestataire
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Ici, un prestataire voit qui l&apos;a contacté, ses avis, et met sa fiche à jour. On y entre en
            revendiquant sa fiche avec son numéro de téléphone. Cette vérification est en cours de refonte et
            revient bientôt.
          </p>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            En attendant, cherchez votre nom : un client a peut-être déjà créé votre fiche.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/providers" className="btn-soft btn-soft--accent">Chercher ma fiche</Link>
            <Link href="/claim" className="btn-soft">J&apos;ai déjà revendiqué ma fiche</Link>
          </div>
        </section>
      </div>
      <AppNav />
    </main>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, providerId, logout } = useAuthStore();
  const [provider, setProvider] = useState<ProviderFull | null>(null);
  const [days, setDays] = useState<ContactDay[] | null>(null);
  const [editing, setEditing] = useState(false);

  // Session serveur absente ou expirée : l'état local ne fait plus foi
  const endSession = useCallback((message: string | null) => {
    logout();
    toast.error(message ?? "Session expirée");
  }, [logout]);

  const load = useCallback(async (id: string) => {
    const [pRes, sRes] = await Promise.all([
      fetch(`/api/providers/${id}`),
      fetch(`/api/providers/${id}/contacts`),
    ]);
    const pJson: ApiResponse<ProviderFull> = await pRes.json();
    if (pJson.data) setProvider(pJson.data);
    const sJson: ApiResponse<ContactStats> = await sRes.json();
    if (sRes.status === 401 || sRes.status === 403) {
      endSession(sJson.error);
      return;
    }
    setDays(sJson.data?.days ?? []);
  }, [endSession]);

  useEffect(() => {
    // Chargement des données distantes : l'état se met à jour à la réponse
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthenticated && providerId) load(providerId);
  }, [isAuthenticated, providerId, load]);

  const week = useMemo(() => (days ? sum(days.slice(-7)) : null), [days]);
  const lastWeek = useMemo(() => (days ? sum(days.slice(0, 7)) : null), [days]);

  if (!isAuthenticated || !providerId) return <NoSession />;

  async function signOut() {
    await fetch("/api/claim/session", { method: "DELETE" }).catch(() => null);
    logout();
    router.push("/");
  }

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    if (!provider) return false;
    const res = await fetch(`/api/providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: ApiResponse<unknown> = await res.json();
    if (res.status === 401 || res.status === 403) {
      endSession(json.error);
      return false;
    }
    if (json.error) {
      toast.error(json.error);
      return false;
    }
    return true;
  }

  async function toggleAvailability(val: boolean) {
    if (await patch({ available: val })) {
      setProvider((p) => (p ? { ...p, available: val } : p));
      toast.success(val ? "Les clients vous voient disponible" : "Les clients vous voient occupé");
    }
  }

  async function handleUpdateProfile(data: ProviderFormValues) {
    const ok = await patch({
      name: data.name,
      bio: data.bio,
      address_label: data.address_label,
      zone_radius_km: data.zone_radius_km,
    });
    if (ok) {
      toast.success("Fiche mise à jour");
      setEditing(false);
      if (providerId) load(providerId);
    }
  }

  async function shareForReviews() {
    if (!provider) return;
    const url = `${window.location.origin}/providers/${provider.id}#avis`;
    const text = `Bonjour, si vous avez été satisfait de mon travail, vous pouvez me laisser un avis ici : ${url}`;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => null);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
  }

  if (!provider || !days || !week || !lastWeek) {
    return (
      <main className="dashboard" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="dashboard-layout space-y-4" aria-busy="true">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
        <AppNav />
      </main>
    );
  }

  const firstName = provider.name.split(" ")[0];
  const weekTotal = week.call + week.whatsapp + week.itinerary;
  const lastTotal = lastWeek.call + lastWeek.whatsapp + lastWeek.itinerary;
  const delta = weekTotal - lastTotal;
  const todo = [
    { done: (provider.bio ?? "").trim().length >= 40, label: "Présentez votre travail en quelques phrases", action: "Écrire" },
    { done: !!provider.address_label?.trim(), label: "Indiquez votre quartier", action: "Ajouter" },
  ];
  const reviews = provider.reviews ?? [];

  return (
    <main className="dashboard" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="dashboard-layout">
        <header className="dashboard-header">
          <div className="min-w-0">
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Votre espace</p>
            <h1 className="truncate font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)" }}>
              Bonjour, {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/providers/${provider.id}`} className="btn-soft" aria-label="Voir ma fiche publique">
              <ExternalLink size={16} aria-hidden />
              <span className="hidden sm:inline">Ma fiche</span>
            </Link>
            <button type="button" onClick={signOut} className="btn-ghost" aria-label="Se déconnecter">
              <LogOut size={18} aria-hidden />
            </button>
          </div>
        </header>

        {/* ─── Le geste du quotidien : se dire disponible ─── */}
        <section className="dashboard-availability" data-on={provider.available}>
          <div className="min-w-0">
            <label htmlFor="availability" className="font-semibold" style={{ fontSize: "var(--text-lg)" }}>
              {provider.available ? "Vous êtes disponible" : "Vous êtes occupé"}
            </label>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {provider.available
                ? "Votre fiche l'affiche : les clients savent qu'ils peuvent vous appeler."
                : "Votre fiche l'affiche : les clients savent que vous êtes pris."}
            </p>
          </div>
          <Switch id="availability" checked={provider.available} onCheckedChange={toggleAvailability} />
        </section>

        <div className="dashboard-grid">
          {/* ─── Activité ─── */}
          <section className="dashboard-panel">
            <h2 className="section-title">Qui vous a contacté</h2>
            <p style={{ fontSize: "var(--text-base)", lineHeight: 1.5 }}>
              {weekTotal === 0 ? (
                "Personne ces 7 derniers jours."
              ) : (
                <>
                  <span className="tabular font-semibold" style={{ fontSize: "var(--text-xl)" }}>{weekTotal}</span>{" "}
                  mise{weekTotal > 1 ? "s" : ""} en contact ces 7 derniers jours
                </>
              )}
              {(weekTotal > 0 || lastTotal > 0) && (
                <span className="block" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  {delta === 0
                    ? "Autant que la semaine d'avant."
                    : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} par rapport à la semaine d'avant.`}
                </span>
              )}
            </p>

            <div className="mt-6">
              <ContactChart days={days.slice(-7)} />
            </div>

            <ul className="mt-5 grid grid-cols-3 gap-2" style={{ fontSize: "var(--text-sm)" }}>
              {[
                { icon: Phone, label: "Appels", value: week.call },
                { icon: MessageCircle, label: "WhatsApp", value: week.whatsapp },
                { icon: Navigation, label: "Itinéraires", value: week.itinerary },
              ].map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex min-w-0 flex-col gap-1 rounded-2xl px-3 py-3" style={{ backgroundColor: "var(--color-surface-sunk)" }}>
                  <Icon size={16} aria-hidden style={{ color: "var(--color-text-muted)" }} />
                  <span className="truncate" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{label}</span>
                  <span className="tabular font-semibold" style={{ fontSize: "var(--text-lg)" }}>{value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>
              Compté quand un client touche Appeler, WhatsApp ou Itinéraire sur votre fiche.
            </p>
          </section>

          <div className="space-y-4">
            {/* ─── Ce qui aide à être choisi ─── */}
            <section className="dashboard-panel">
              <h2 className="section-title">Pour être choisi</h2>
              <ul className="space-y-1">
                {todo.map(({ done, label, action }) => (
                  <li key={label} className="flex min-h-[48px] items-center gap-3">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: done ? "var(--color-success)" : "transparent",
                        border: done ? "none" : "1.5px solid var(--color-border)",
                      }}
                      aria-hidden
                    >
                      {done && <Check size={14} style={{ color: "var(--color-on-primary)" }} />}
                    </span>
                    <span className="flex-1" style={{ fontSize: "var(--text-sm)", color: done ? "var(--color-text-muted)" : "var(--color-text)" }}>
                      <span className="sr-only">{done ? "Fait : " : "À faire : "}</span>
                      {label}
                    </span>
                    {!done && (
                      <button type="button" onClick={() => setEditing(true)} className="font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}>
                        {action}
                      </button>
                    )}
                  </li>
                ))}
                <li className="flex min-h-[48px] items-center gap-3">
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: reviews.length ? "var(--color-success)" : "transparent",
                      border: reviews.length ? "none" : "1.5px solid var(--color-border)",
                    }}
                    aria-hidden
                  >
                    {reviews.length > 0 && <Check size={14} style={{ color: "var(--color-on-primary)" }} />}
                  </span>
                  <span className="flex-1" style={{ fontSize: "var(--text-sm)" }}>
                    {reviews.length ? `${reviews.length} avis reçu${reviews.length > 1 ? "s" : ""}` : "Demandez un avis à vos derniers clients"}
                  </span>
                  <button type="button" onClick={shareForReviews} className="flex items-center gap-1 font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}>
                    <Share2 size={14} aria-hidden />
                    Partager
                  </button>
                </li>
              </ul>
              {!editing && (
                <button type="button" onClick={() => setEditing(true)} className="btn-soft mt-4 w-full justify-center">
                  Modifier ma fiche
                </button>
              )}
            </section>

            {/* ─── Comme les clients vous voient ─── */}
            <section className="dashboard-panel">
              <h2 className="section-title">Dans les résultats</h2>
              <p className="mb-3" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Voici comment vous apparaissez quand un client cherche près de vous (distance donnée pour l&apos;exemple).
              </p>
              <div className="pointer-events-none rounded-2xl" style={{ backgroundColor: "var(--color-bg)" }} inert>
                <ProviderCard provider={{ ...provider, distance_km: 0.8, cover_photo: provider.photos?.[0] ?? null }} />
              </div>
            </section>
          </div>
        </div>

        {editing && (
          <section className="dashboard-panel mt-4" aria-label="Modifier ma fiche">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title !mb-0">Modifier ma fiche</h2>
              <button type="button" onClick={() => setEditing(false)} className="font-medium" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Annuler
              </button>
            </div>
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
              submitLabel="Enregistrer"
            />
          </section>
        )}

        {/* ─── Avis ─── */}
        <section className="dashboard-panel mt-4">
          <h2 className="section-title">Vos avis</h2>
          {reviews.length ? (
            <ul>
              {reviews.slice(0, 6).map((r: PublicReview) => (
                <li key={r.id} className="border-b py-3 first:pt-0 last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1" style={{ fontSize: "var(--text-sm)" }}>
                      <Star size={14} fill="var(--color-accent)" stroke="none" aria-hidden />
                      <span className="tabular">{r.rating}/5</span>
                    </span>
                    <time dateTime={r.created_at} style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                      {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </time>
                  </div>
                  {r.comment && <p className="mt-1.5 max-w-[65ch]" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}>{r.comment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Pas encore d&apos;avis. Les fiches avec des avis sont plus souvent choisies : partagez le lien de votre fiche à vos clients satisfaits.
            </p>
          )}
        </section>
      </div>
      <AppNav />
    </main>
  );
}
