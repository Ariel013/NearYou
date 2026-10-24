import { create } from "zustand";
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_RADIUS_KM } from "@/types";

interface Position {
  lat: number;
  lng: number;
}

interface SearchStore {
  /** Centre de la recherche : position par défaut, zone choisie sur la carte, ou l'usager. */
  position: Position | null;
  /** L'usager lui-même, seulement s'il s'est localisé : seule base honnête pour un « à X m de vous ». */
  userPosition: Position | null;
  radius: number;
  activeCategory: string | null;
  query: string;
  setPosition: (pos: Position) => void;
  /** Localisation réussie : centre la recherche sur l'usager et le retient. */
  setUserPosition: (pos: Position) => void;
  setRadius: (r: number) => void;
  setActiveCategory: (slug: string | null) => void;
  setQuery: (q: string) => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  position: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
  radius: DEFAULT_RADIUS_KM,
  activeCategory: null,
  query: "",
  userPosition: null,
  setPosition: (pos) => set({ position: pos }),
  setUserPosition: (pos) => set({ position: pos, userPosition: pos }),
  setRadius: (radius) => set({ radius }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setQuery: (query) => set({ query }),
  resetFilters: () =>
    set({ activeCategory: null, query: "", radius: DEFAULT_RADIUS_KM }),
}));
