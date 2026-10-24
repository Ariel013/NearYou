"use client";

import { Share2 } from "lucide-react";

/** Partager la fiche : feuille de partage du téléphone, sinon WhatsApp directement. */
export function ShareButton({ name, category }: { name: string; category: string | null }) {
  function share() {
    const url = window.location.href;
    const text = category ? `${name}, ${category.toLowerCase()}, trouvé sur NearYou` : `${name}, trouvé sur NearYou`;
    if (navigator.share) {
      navigator.share({ title: name, text, url }).catch(() => {});
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} : ${url}`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={share} className="btn-soft">
      <Share2 size={16} aria-hidden />
      Partager
    </button>
  );
}
