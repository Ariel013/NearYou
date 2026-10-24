"use client";

import { useState, type ElementType, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, MessageCircle, Navigation, Star, MapPin, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { buildWaLink, formatDistance } from "@/lib/geo";
import { ReviewSheet } from "@/components/providers/ReviewSheet";
import { requestCompassPermission } from "@/lib/compass";
import type { ProviderWithDistance } from "@/types";

interface NavTarget { name: string; lat: number; lng: number }

function ContactButton({ href, target, rel, onClick, tone, icon, label }: {
  href?: string; target?: string; rel?: string; onClick?: () => void;
  tone: "primary" | "whatsapp" | "accent";
  icon: ReactNode; label: string;
}) {
  const styles = {
    primary: { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" },
    whatsapp: { backgroundColor: "var(--color-whatsapp)", color: "var(--color-on-primary)" },
    accent: { backgroundColor: "var(--color-accent-light)", color: "var(--color-accent-strong)" },
  }[tone];
  const cls = "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl font-semibold transition-transform active:scale-[0.97]";
  const content = (
    <>
      {icon}
      <span style={{ fontSize: "var(--text-xs)" }}>{label}</span>
    </>
  );
  if (href) {
    return <a href={href} target={target} rel={rel} onClick={onClick} className={cls} style={styles}>{content}</a>;
  }
  return <button type="button" onClick={onClick} className={cls} style={styles}>{content}</button>;
}

interface ProviderPreviewProps {
  provider: ProviderWithDistance;
  onNavigate?: (target: NavTarget) => void;
  onClose: () => void;
  /** Titre accessible : SheetTitle dans le panneau mobile, h2 ailleurs. */
  Title?: ElementType;
  /** Sur ordinateur, l'aperçu remplace la liste : un retour s'affiche. */
  showBack?: boolean;
}

/** Aperçu d'un prestataire : contact en un geste, puis la fiche complète. */
export function ProviderPreview({ provider, onNavigate, onClose, Title = "h2", showBack = false }: ProviderPreviewProps) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  const { lat, lng } = provider;
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const initials = provider.name.slice(0, 2).toUpperCase();
  const category = provider.categories?.[0]?.name;

  function logContact(type: "call" | "whatsapp" | "itinerary") {
    fetch(`/api/providers/${provider.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_type: type }),
    }).catch(() => {});
  }

  async function startNavigation() {
    await requestCompassPermission();
    logContact("itinerary");
    onNavigate?.({ name: provider.name, lat, lng });
  }

  return (
    <>
      {showReview && (
        <ReviewSheet
          providerId={provider.id}
          onClose={(submitted) => {
            setShowReview(false);
            if (submitted) router.refresh();
          }}
        />
      )}

      <div className="space-y-5">
        {showBack && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 font-medium"
            style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={16} aria-hidden />
            Retour à la liste
          </button>
        )}

        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {provider.cover_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.cover_photo.url}
                alt=""
                width={64}
                height={64}
                className="rounded-2xl object-cover"
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <div
                aria-hidden
                className="flex items-center justify-center rounded-2xl font-bold"
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: "var(--color-accent-light)",
                  color: "var(--color-accent-strong)",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                }}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Title
                className="font-bold"
                style={{ fontSize: "var(--text-lg)", color: "var(--color-text)", fontFamily: "var(--font-display)" }}
              >
                {provider.name}
              </Title>
              {provider.claimed_at && <BadgeVerified />}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {category && <span>{category}</span>}
              <span className="tabular" style={{ color: "var(--color-text)" }}>{formatDistance(provider.distance_km)}</span>
              {provider.claimed_at && (
                <span className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: provider.available ? "var(--color-success)" : "var(--color-text-light)" }}
                    aria-hidden
                  />
                  {provider.available ? "Disponible" : "Occupé"}
                </span>
              )}
            </p>
            <p className="mt-1 flex items-center gap-1" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {provider.review_count > 0 ? (
                <>
                  <Star size={14} fill="var(--color-accent)" stroke="none" aria-hidden />
                  <span className="tabular" style={{ color: "var(--color-text)" }}>{provider.avg_rating.toFixed(1)}</span>
                  <span>· {provider.review_count} avis</span>
                </>
              ) : (
                <span>Pas encore d&apos;avis</span>
              )}
            </p>
            {provider.address_label && (
              <p className="mt-1 flex items-center gap-1" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                <MapPin size={12} aria-hidden />
                <span className="truncate">{provider.address_label}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ContactButton
            href={`tel:${provider.contact_phone}`}
            onClick={() => logContact("call")}
            tone="primary"
            icon={<Phone size={20} aria-hidden />}
            label="Appeler"
          />
          <ContactButton
            href={buildWaLink(provider.contact_phone)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logContact("whatsapp")}
            tone="whatsapp"
            icon={<MessageCircle size={20} aria-hidden />}
            label="WhatsApp"
          />
          {hasLocation ? (
            <ContactButton
              onClick={startNavigation}
              tone="accent"
              icon={<Navigation size={20} aria-hidden />}
              label="Itinéraire"
            />
          ) : <div />}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            href={`/providers/${provider.id}`}
            className="btn-soft"
          >
            Voir la fiche complète
          </Link>
          <button
            type="button"
            onClick={() => setShowReview(true)}
            className="flex items-center gap-1.5 font-semibold"
            style={{ fontSize: "var(--text-sm)", color: "var(--color-accent-strong)" }}
          >
            <Star size={15} aria-hidden />
            Laisser un avis
          </button>
        </div>
      </div>
    </>
  );
}

interface ProviderSheetProps {
  provider: ProviderWithDistance | null;
  open: boolean;
  onClose: () => void;
  onNavigate?: (target: NavTarget) => void;
}

/** Aperçu en panneau du bas, sur téléphone. */
export function ProviderSheet({ provider, open, onClose, onNavigate }: ProviderSheetProps) {
  if (!provider) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[70vh] overflow-y-auto rounded-t-[28px] p-0"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-[5px] w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),24px)]">
          <ProviderPreview provider={provider} onClose={onClose} onNavigate={onNavigate} Title={SheetTitle} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
