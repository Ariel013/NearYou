import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, Radius, CalendarDays, ExternalLink } from "lucide-react";
import { AppNav } from "@/components/shared/AppNav";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { buildMapsLink, parseWkbPoint } from "@/lib/geo";
import { createServiceClient } from "@/lib/supabase/server";
import type { ProviderFull, PublicReview } from "@/types";
import { toPublicReview } from "@/lib/public-data";
import { BackButton } from "./BackButton";
import { ProviderDetailMap } from "@/components/map/ProviderDetailMap";
import { ContactActions } from "./ContactActions";
import { ReportButton, ReviewButton } from "./ProviderActions";
import { MediaOnly } from "@/components/shared/MediaOnly";
import { ProviderPlace } from "./ProviderPlace";
import { ShareButton } from "./ShareButton";

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
    title: `${provider.name} · ${category} | NearYou`,
    description: provider.bio ?? `Contactez ${provider.name}, ${category} disponible près de chez vous.`,
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          aria-hidden
          fill={i <= Math.round(rating) ? "var(--color-accent)" : "var(--color-border)"}
          stroke="none"
        />
      ))}
    </span>
  );
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
  const location = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? { lat, lng } : null;
  // Même lettre que l'épingle de la carte : on reconnaît le prestataire d'un écran à l'autre
  const initial = provider.name.trim().slice(0, 1).toUpperCase();
  const since = new Date(provider.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const reviews = provider.reviews ?? [];
  const category = provider.categories?.[0]?.name ?? null;
  const contact = (
    <ContactActions providerId={provider.id} phone={provider.contact_phone} name={provider.name} location={location} />
  );
  const mapsLink = location && (
    <a
      href={buildMapsLink(location.lat, location.lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center gap-1.5 font-medium underline underline-offset-4"
      style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}
    >
      <ExternalLink size={14} aria-hidden />
      Ouvrir dans Maps
    </a>
  );

  return (
    <main className="provider-page" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Téléphone : la photo s'il y en a une, sinon rien de décoratif ; le retour flotte */}
      <div className="relative lg:hidden">
        {cover ? (
          <div className="h-56 w-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-sunk)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.url} alt="" className="h-full w-full object-cover" loading="eager" />
          </div>
        ) : (
          <div className="h-16" />
        )}
        <BackButton floating />
      </div>

      <div className="provider-layout">
        {/* ─── Colonne principale ─── */}
        <div className="min-w-0 space-y-8">
          <div className="hidden lg:block">
            <BackButton />
          </div>

          {/* Identité : qui, quoi, où et à quelle distance */}
          <header className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl font-bold lg:h-20 lg:w-20"
              style={{
                backgroundColor: "var(--color-accent-light)",
                color: "var(--color-accent-strong)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
              }}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="font-bold leading-tight"
                  style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", color: "var(--color-text)" }}
                >
                  {provider.name}
                </h1>
                {provider.claimed_at && <BadgeVerified />}
              </div>
              {provider.categories?.length > 0 && (
                <p className="mt-1" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)" }}>
                  {provider.categories.map((c) => c.name).join(" · ")}
                </p>
              )}
              <ProviderPlace address={provider.address_label} location={location} />
              {/* La disponibilité n'a de sens que déclarée par le prestataire lui-même */}
              {(provider.claimed_at || provider.review_count > 0) && (
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: "var(--text-sm)" }}>
                  {provider.claimed_at && (
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: provider.available ? "var(--color-success)" : "var(--color-text-light)" }}
                      />
                      {provider.available ? "Disponible" : "Occupé en ce moment"}
                      <span style={{ color: "var(--color-text-muted)" }}>, selon le prestataire</span>
                    </span>
                  )}
                  {provider.review_count > 0 && (
                    <a href="#avis" className="flex items-center gap-1.5">
                      <Star size={14} fill="var(--color-accent)" stroke="none" aria-hidden />
                      <span className="tabular">{provider.avg_rating.toFixed(1)}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>· {provider.review_count} avis</span>
                    </a>
                  )}
                </p>
              )}
              <div className="mt-4">
                <ShareButton name={provider.name} category={category} />
              </div>
            </div>
          </header>

          {/* Repères */}
          <dl className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8" style={{ fontSize: "var(--text-sm)" }}>
            <div className="flex items-start gap-2">
              <Radius size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} aria-hidden />
              <div>
                <dt className="sr-only">Zone d&apos;intervention</dt>
                <dd>Se déplace jusqu&apos;à {provider.zone_radius_km}&nbsp;km</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} aria-hidden />
              <div>
                <dt className="sr-only">Présence sur NearYou</dt>
                <dd>Sur NearYou depuis {since}</dd>
              </div>
            </div>
          </dl>

          {provider.bio && (
            <section>
              <h2 className="section-title">À propos</h2>
              <p className="max-w-[65ch]" style={{ fontSize: "var(--text-base)", lineHeight: 1.6 }}>
                {provider.bio}
              </p>
            </section>
          )}

          {/* Carte : dans le flux sur téléphone, colonne entière sur ordinateur */}
          {location && (
            <section className="lg:hidden">
              <h2 className="section-title">Où le trouver</h2>
              <MediaOnly on="mobile">
                <ProviderDetailMap lat={lat} lng={lng} name={provider.name} />
              </MediaOnly>
              <div className="mt-1">{mapsLink}</div>
            </section>
          )}

          {provider.photos?.length > 1 && (
            <section>
              <h2 className="section-title">Réalisations</h2>
              <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
                {provider.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.caption ?? `Réalisation de ${provider.name}`}
                    loading="lazy"
                    className="h-32 w-44 flex-shrink-0 rounded-2xl object-cover lg:h-40 lg:w-full"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Avis : une ligne tant qu'il n'y en a pas, la liste ensuite */}
          <section id="avis" className="scroll-mt-6">
            {reviews.length ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="section-title !mb-0">
                    Avis <span className="tabular" style={{ color: "var(--color-text-muted)" }}>{provider.review_count}</span>
                  </h2>
                  <ReviewButton providerId={provider.id} />
                </div>
                <ul>
                  {reviews.slice(0, 8).map((r: PublicReview) => (
                    <li key={r.id} className="border-b py-4 first:pt-0 last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <Stars rating={r.rating} />
                        <time dateTime={r.created_at} style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
                          {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </time>
                      </div>
                      {r.comment && (
                        <p className="mt-2 max-w-[65ch]" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                          {r.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="section-title">Avis</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="max-w-[46ch]" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    Pas encore d&apos;avis. Vous avez fait appel à {provider.name} ?
                  </p>
                  <ReviewButton providerId={provider.id} first />
                </div>
              </>
            )}
          </section>

          <footer
            className="flex flex-wrap items-center justify-between gap-2 border-t pt-4"
            style={{ borderColor: "var(--color-border)" }}
          >
            <ReportButton providerId={provider.id} />
            <Link
              href={`/claim?phone=${encodeURIComponent(provider.contact_phone)}`}
              className="inline-flex min-h-[44px] items-center font-medium underline underline-offset-4"
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
            >
              C&apos;est ma fiche
            </Link>
          </footer>
        </div>

        {/* ─── Ordinateur : la carte occupe la colonne, le contact posé dessus ─── */}
        <aside className="hidden lg:block">
          <div className="provider-aside" data-map={!!location}>
            {location && (
              <MediaOnly on="desktop">
                <ProviderDetailMap lat={lat} lng={lng} name={provider.name} className="absolute inset-0" />
              </MediaOnly>
            )}
            <div className="provider-aside__card">
              <p className="mb-3 font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Contacter {provider.name.split(" ")[0]}
              </p>
              {contact}
              {mapsLink && <div className="mt-2 flex justify-center">{mapsLink}</div>}
            </div>
          </div>
        </aside>
      </div>

      {/* Téléphone : contact toujours à portée de pouce */}
      <div className="provider-contact-bar lg:hidden">{contact}</div>

      <AppNav />
    </main>
  );
}
