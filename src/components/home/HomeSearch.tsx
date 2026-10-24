"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Loader } from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/search/SearchBar";
import { useSearchStore } from "@/store/useSearchStore";

/** Recherche de l'accueil : un métier ou un nom, ou directement « autour de moi ». */
export function HomeSearch() {
  const router = useRouter();
  const setUserPosition = useSearchStore((s) => s.setUserPosition);
  const [locating, setLocating] = useState(false);

  function aroundMe() {
    if (!navigator.geolocation) {
      router.push("/providers");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        router.push("/providers");
      },
      () => {
        setLocating(false);
        toast.error("Position introuvable. Vous pourrez déplacer la carte vers votre quartier.");
        router.push("/providers");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <SearchBar placeholder="Un métier, un nom…" />
      </div>
      <button
        type="button"
        onClick={aroundMe}
        disabled={locating}
        className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-5 font-semibold disabled:opacity-70"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)", fontSize: "var(--text-sm)" }}
      >
        {locating ? <Loader size={18} className="animate-spin" aria-hidden /> : <LocateFixed size={18} aria-hidden />}
        {locating ? "Localisation…" : "Autour de moi"}
      </button>
    </div>
  );
}
