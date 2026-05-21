"use client";

import type { ReactNode } from "react";

interface ContactLoggerProps {
  providerId: string;
  type: "call" | "whatsapp" | "itinerary";
  phone: string;
  children: ReactNode;
}

export function ContactLogger({ providerId, type, children }: ContactLoggerProps) {
  function log() {
    fetch(`/api/providers/${providerId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_type: type }),
    }).catch(() => {});
  }

  return <span onClick={log}>{children}</span>;
}
