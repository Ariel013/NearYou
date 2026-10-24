import { create } from "zustand";
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_RADIUS_KM } from "@/types";

interface Position {
  lat: number;
  lng: number;
}

interface SearchStore {
  position: Position | null;
  radius: number;
  activeCategory: string | null;
  query: string;
  setPosition: (pos: Position) => void;
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
  setPosition: (pos) => set({ position: pos }),
  setRadius: (radius) => set({ radius }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setQuery: (query) => set({ query }),
  resetFilters: () =>
    set({ activeCategory: null, query: "", radius: DEFAULT_RADIUS_KM }),
}));
