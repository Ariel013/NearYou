"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, MessageCircle, Navigation, Flag, Star, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { StarRating } from "@/components/shared/StarRating";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { buildWaLink } from "@/lib/geo";
import { ReviewSheet } from "@/components/providers/ReviewSheet";
import { requestCompassPermission } from "@/lib/compass";
import type { ProviderWithDistance } from "@/types";

interface NavTarget { name: string; lat: number; lng: number }

interface ProviderSheetProps {
  provider: ProviderWithDistance | null;
  open: boolean;
  onClose: () => void;
  onNavigate?: (target: NavTarget) => void;
}

export function ProviderSheet({ provider, open, onClose, onNavigate }: ProviderSheetProps) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  if (!provider) return null;

  const { lat, lng } = provider;
  const hasLocation =
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

  async function logContact(type: "call" | "whatsapp" | "itinerary") {
    if (!provider) return;
    await fetch(`/api/providers/${provider.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_type: type }),
    });
  }

  async function startNavigation() {
    await requestCompassPermission();
    logContact("itinerary");
    onNavigate?.({ name: provider!.name, lat, lng });
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

      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] p-0 max-h-[58vh] overflow-y-auto"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="h-[5px] w-10 rounded-full"
              style={{ backgroundColor: "var(--color-border)" }}
            />
          </div>

          <div className="px-5 pb-8 space-y-4">
            {/* Header prestataire */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {provider.cover_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={provider.cover_photo.url}
                    alt={provider.name}
                    width={60}
                    height={60}
                    className="rounded-2xl object-cover"
                    style={{ width: 60, height: 60 }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-2xl font-bold text-white"
                    style={{
                      width: 60,
                      height: 60,
                      background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                      fontSize: "var(--text-lg)",
                    }}
                  >
                    {provider.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {/* Indicateur disponibilité */}
                {provider.available && (
                  <div
                    className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2"
                    style={{
                      backgroundColor: "var(--color-success)",
                      borderColor: "var(--color-surface)",
                    }}
                    title="Disponible"
                  />
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle
                    className="font-bold"
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--color-text)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {provider.name}
                  </SheetTitle>
                  {provider.claimed_at && <BadgeVerified />}
                </div>

                {provider.categories?.[0] && (
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 mt-1"
                    style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                    }}
                  >
                    {provider.categories[0].name}
                  </span>
                )}

                <div className="mt-1.5">
                  <StarRating rating={provider.avg_rating} count={provider.review_count} size="sm" />
                </div>

                {provider.address_label && (
                  <p
                    className="mt-1 flex items-center gap-1 truncate"
                    style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}
                  >
                    <MapPin size={11} />
                    {provider.address_label}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons de contact */}
            <div className="grid grid-cols-3 gap-3">
              <a
                href={`tel:${provider.contact_phone}`}
                onClick={() => logContact("call")}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 transition-all active:scale-95"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  boxShadow: "0 2px 12px rgba(27,108,168,0.12)",
                }}
                aria-label="Appeler"
              >
                <Phone size={22} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 600 }}>
                  Appeler
                </span>
              </a>

              <a
                href={buildWaLink(provider.contact_phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logContact("whatsapp")}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 transition-all active:scale-95"
                style={{
                  backgroundColor: "#E7F5EE",
                  boxShadow: "0 2px 12px rgba(34,197,94,0.12)",
                }}
                aria-label="WhatsApp"
              >
                <MessageCircle size={22} style={{ color: "#22C55E" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "#22C55E", fontWeight: 600 }}>
                  WhatsApp
                </span>
              </a>

              {hasLocation ? (
                <button
                  onClick={startNavigation}
                  className="flex flex-col items-center gap-2 rounded-2xl py-4 transition-all active:scale-95"
                  style={{
                    backgroundColor: "var(--color-accent-light)",
                    boxShadow: "0 2px 12px rgba(245,166,35,0.12)",
                  }}
                  aria-label="Itinéraire"
                >
                  <Navigation size={22} style={{ color: "var(--color-accent)" }} />
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 600 }}>
                    Itinéraire
                  </span>
                </button>
              ) : <div />}
            </div>

            {/* Laisser un avis */}
            <button
              onClick={() => setShowReview(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-accent-light)",
                border: "1.5px solid var(--color-accent)",
                color: "var(--color-accent)",
                fontSize: "var(--text-sm)",
                boxShadow: "0 2px 12px rgba(245,166,35,0.10)",
              }}
              aria-label="Laisser un avis"
            >
              <Star size={16} fill="var(--color-accent)" stroke="none" />
              Laisser un avis
            </button>

            {/* Liens bas */}
            <div
              className="flex items-center justify-between pt-1"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <Link
                href={`/providers/${provider.id}`}
                onClick={onClose}
                className="rounded-full px-4 py-2 font-semibold transition-all active:opacity-70"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1.5px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "var(--text-xs)",
                }}
              >
                Voir la fiche complète
              </Link>

              <Link
                href={`/claim?phone=${encodeURIComponent(provider.contact_phone)}`}
                className="flex items-center gap-1.5 transition-opacity active:opacity-60"
                style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}
              >
                <Flag size={13} />
                C&apos;est ma fiche
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
