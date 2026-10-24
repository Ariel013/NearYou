"use client";

import { useState } from "react";
import { Phone, MessageCircle, Navigation } from "lucide-react";
import { NavigationViewDynamic } from "@/components/map/NavigationViewDynamic";
import { requestCompassPermission } from "@/lib/compass";
import { buildWaLink } from "@/lib/geo";

interface ContactActionsProps {
  providerId: string;
  phone: string;
  name: string;
  /** Absent : pas d'itinéraire possible. */
  location: { lat: number; lng: number } | null;
}

type ContactType = "call" | "whatsapp" | "itinerary";

function logContact(providerId: string, type: ContactType) {
  fetch(`/api/providers/${providerId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact_type: type }),
  }).catch(() => {});
}

/** Les trois façons de joindre le prestataire, chacune comptée pour son tableau de bord. */
export function ContactActions({ providerId, phone, name, location }: ContactActionsProps) {
  const [navOpen, setNavOpen] = useState(false);

  async function openNavigation() {
    await requestCompassPermission();
    logContact(providerId, "itinerary");
    setNavOpen(true);
  }

  return (
    <>
      {/* Barre du téléphone : itinéraire en icône au bout. Carte de l'ordinateur : sur sa propre ligne. */}
      <div className={`grid gap-2 lg:grid-cols-2 ${location ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-2"}`}>
        <a
          href={`tel:${phone}`}
          onClick={() => logContact(providerId, "call")}
          className="contact-btn"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
        >
          <Phone size={18} aria-hidden />
          Appeler
        </a>
        <a
          href={buildWaLink(phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logContact(providerId, "whatsapp")}
          className="contact-btn"
          style={{ backgroundColor: "var(--color-whatsapp)", color: "var(--color-on-primary)" }}
        >
          <MessageCircle size={18} aria-hidden />
          WhatsApp
        </a>
        {location && (
          <button
            type="button"
            onClick={openNavigation}
            className="contact-btn px-4 lg:col-span-2"
            style={{ backgroundColor: "var(--color-accent-light)", color: "var(--color-accent-strong)" }}
            aria-label="Itinéraire"
          >
            <Navigation size={18} aria-hidden />
            <span className="hidden sm:inline">Itinéraire</span>
          </button>
        )}
      </div>

      {navOpen && location && (
        <NavigationViewDynamic target={{ name, ...location }} onClose={() => setNavOpen(false)} />
      )}
    </>
  );
}
