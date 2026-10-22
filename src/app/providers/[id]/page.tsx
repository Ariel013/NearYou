import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { StarRating } from "@/components/shared/StarRating";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { buildWaLink, parseWkbPoint } from "@/lib/geo";
import { createServiceClient } from "@/lib/supabase/server";
import type { ProviderFull, PublicReview } from "@/types";
import { toPublicReview } from "@/lib/public-data";
import { BackButton } from "./BackButton";
import { ContactLogger } from "./ContactLogger";
import { ProviderDetailMap } from "@/components/map/ProviderDetailMap";
import { NavigationButton } from "./NavigationButton";
import { ProviderActions } from "./ProviderActions";

async function getProvider(id: string): Promise<ProviderFull | null> {
  try {
    const supabase = await createServiceClient();

    const { data: provider, error } = await supabase
      .from("providers")
      .select("*, provider_categories(category_id, categories(*)), provider_photos(*), reviews(*)")
      .eq("id", id)
      .single();

    if (error || !provider) return null;

    const coords = parseWkbPoint(provider.location);
    const lat = coords?.lat ?? 0;
    const lng = coords?.lng ?? 0;

    return {
      id:               provider.id,
      name:             provider.name,
      contact_phone:    provider.contact_phone,
      bio:              provider.bio,
      address_label:    provider.address_label,
      zone_radius_km:   provider.zone_radius_km,
      available:        provider.available,
      verified_at:      provider.verified_at,
      claimed_at:       provider.claimed_at,
      avg_rating:       provider.avg_rating,
      review_count:     provider.review_count,
      disabled_at:      provider.disabled_at ?? null,
      created_at:       provider.created_at,
      updated_at:       provider.updated_at,
      lat,
      lng,
      categories: provider.provider_categories.map(
        (pc: { categories: unknown }) => pc.categories,
      ),
      photos:  provider.provider_photos,
      reviews: provider.reviews.map(toPublicReview),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) return { title: "Prestataire introuvable" };

  const category = provider.categories?.[0]?.name ?? "Prestataire";
  return {
    title: `${provider.name} — ${category} | NearYou`,
    description: provider.bio ?? `Contactez ${provider.name}, ${category} disponible près de chez vous.`,
  };
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) notFound();

  const cover = provider.photos?.find((p) => p.is_cover) ?? provider.photos?.[0];
  const { lat, lng } = provider;

  return (
    <main className="min-h-screen pb-32" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Cover photo */}
      <div className="relative h-56 w-full overflow-hidden" style={{ backgroundColor: "var(--color-primary-light)" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={provider.name}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-6xl font-bold"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}
          >
            {provider.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <BackButton />
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Identity */}
        <section className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h1
              className="font-bold leading-snug"
              style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-text)" }}
            >
              {provider.name}
            </h1>
            {provider.claimed_at && <BadgeVerified />}
          </div>

          {provider.categories?.[0] && (
            <p style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
              {provider.categories.map((c) => c.name).join(" · ")}
            </p>
          )}

          <div className="flex items-center gap-4">
            <StarRating rating={provider.avg_rating} count={provider.review_count} />
            {provider.available ? (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}
              >
                Disponible
              </span>
            ) : (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: "var(--color-warning-light)", color: "var(--color-warning)" }}
              >
                Occupé
              </span>
            )}
          </div>

          {provider.address_label && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              📍 {provider.address_label}
            </p>
          )}

          {/* Boutons avis + signalement — toujours visibles sans scroller */}
          <ProviderActions providerId={provider.id} />
        </section>

        {/* Bio */}
        {provider.bio && (
          <section
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
          >
            <h2 className="mb-2 font-semibold" style={{ fontSize: "var(--text-base)" }}>À propos</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>{provider.bio}</p>
          </section>
        )}

        {/* Location map */}
        {Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) && (
          <section>
            <h2 className="mb-3 font-semibold" style={{ fontSize: "var(--text-base)" }}>Localisation</h2>
            <ProviderDetailMap lat={lat} lng={lng} name={provider.name} />
          </section>
        )}

        {/* Photo gallery */}
        {provider.photos?.length > 1 && (
          <section>
            <h2 className="mb-3 font-semibold" style={{ fontSize: "var(--text-base)" }}>Portfolio</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
              {provider.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.caption ?? provider.name}
                  width={160}
                  height={120}
                  loading="lazy"
                  className="flex-shrink-0 rounded-2xl object-cover"
                  style={{ width: 160, height: 120 }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
          <h2 className="mb-3 font-semibold" style={{ fontSize: "var(--text-base)" }}>
            Avis clients ({provider.review_count})
          </h2>
          {provider.reviews?.length ? (
            <ul className="space-y-3">
              {provider.reviews.slice(0, 5).map((r: PublicReview) => (
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
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Aucun avis pour l&apos;instant.
            </p>
          )}
        </section>

        {/* Claim link */}
        <div className="flex items-center justify-center">
          <a
            href={`/claim?phone=${encodeURIComponent(provider.contact_phone)}`}
            className="text-sm underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            C&apos;est ma fiche
          </a>
        </div>
      </div>

      {/* Sticky contact bar */}
      <div
        className="fixed bottom-16 left-0 right-0 z-40 px-5 py-3"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex gap-3">
          <ContactLogger providerId={provider.id} type="call" phone={provider.contact_phone}>
            <a
              href={`tel:${provider.contact_phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-medium"
              style={{ backgroundColor: "var(--color-primary)", color: "white", fontSize: "var(--text-sm)" }}
            >
              <Phone size={16} />
              Appeler
            </a>
          </ContactLogger>

          <ContactLogger providerId={provider.id} type="whatsapp" phone={provider.contact_phone}>
            <a
              href={buildWaLink(provider.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-medium"
              style={{ backgroundColor: "#22C55E", color: "white", fontSize: "var(--text-sm)" }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </ContactLogger>

          {Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) && (
            <NavigationButton name={provider.name} lat={lat} lng={lng} />
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
