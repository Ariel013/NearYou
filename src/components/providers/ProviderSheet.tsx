"use client";

import Link from "next/link";
import { Phone, MessageCircle, Navigation, Flag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StarRating } from "@/components/shared/StarRating";
import { BadgeVerified } from "@/components/shared/BadgeVerified";
import { buildWaLink } from "@/lib/geo";
import type { ProviderWithDistance } from "@/types";

interface NavTarget { name: string; lat: number; lng: number }

interface ProviderSheetProps {
  provider: ProviderWithDistance | null;
  open: boolean;
  onClose: () => void;
  onNavigate?: (target: NavTarget) => void;
}

export function ProviderSheet({ provider, open, onClose, onNavigate }: ProviderSheetProps) {
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

  function startNavigation() {
    logContact("itinerary");
    onNavigate?.({ name: provider!.name, lat, lng });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        {/* max-h réduit à ~50% pour laisser la carte visible au-dessus */}
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-5 pb-6 pt-5 max-h-[52vh] overflow-y-auto"
        >
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              {provider.cover_photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.cover_photo.url}
                  alt={provider.name}
                  width={48}
                  height={48}
                  className="rounded-xl object-cover flex-shrink-0"
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-xl text-white font-bold flex-shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: "var(--color-primary)", fontSize: "var(--text-base)" }}
                >
                  {provider.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <SheetTitle
                    className="text-left"
                    style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}
                  >
                    {provider.name}
                  </SheetTitle>
                  {provider.claimed_at && <BadgeVerified />}
                </div>
                {provider.categories?.[0] && (
                  <p style={{ color: "var(--color-primary)", fontSize: "var(--text-xs)", fontWeight: 500 }}>
                    {provider.categories[0].name}
                  </p>
                )}
                <div className="mt-0.5">
                  <StarRating rating={provider.avg_rating} count={provider.review_count} size="sm" />
                </div>
              </div>

              {/* Distance */}
              {provider.address_label && (
                <p className="flex-shrink-0 text-right" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                  {provider.address_label}
                </p>
              )}
            </div>
          </SheetHeader>

          {/* Boutons de contact */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <a
              href={`tel:${provider.contact_phone}`}
              onClick={() => logContact("call")}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-opacity active:opacity-70"
              style={{ backgroundColor: "var(--color-primary-light)" }}
              aria-label="Appeler"
            >
              <Phone size={20} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 500 }}>
                Appeler
              </span>
            </a>

            <a
              href={buildWaLink(provider.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logContact("whatsapp")}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-opacity active:opacity-70"
              style={{ backgroundColor: "#E7F5EE" }}
              aria-label="WhatsApp"
            >
              <MessageCircle size={20} style={{ color: "#22C55E" }} />
              <span style={{ fontSize: "var(--text-xs)", color: "#22C55E", fontWeight: 500 }}>
                WhatsApp
              </span>
            </a>

            {hasLocation ? (
              <button
                onClick={startNavigation}
                className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-opacity active:opacity-70"
                style={{ backgroundColor: "var(--color-accent-light)" }}
                aria-label="Itinéraire"
              >
                <Navigation size={20} style={{ color: "var(--color-accent)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 500 }}>
                  Itinéraire
                </span>
              </button>
            ) : (
              <div />
            )}
          </div>


          {/* Liens bas de sheet */}
          <div className="mt-4 flex items-center justify-between">
            <Link
              href={`/providers/${provider.id}`}
              className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Voir la fiche complète
            </Link>
            <Link
              href={`/claim?phone=${provider.contact_phone}`}
              className="flex items-center gap-1"
              style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}
            >
              <Flag size={14} />
              C&apos;est ma fiche
            </Link>
          </div>
        </SheetContent>
      </Sheet>
  );
}
