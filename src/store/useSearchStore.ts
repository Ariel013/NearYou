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
  viewMode: "map" | "list";
  setPosition: (pos: Position) => void;
  setRadius: (r: number) => void;
  setActiveCategory: (slug: string | null) => void;
  setQuery: (q: string) => void;
  setViewMode: (mode: "map" | "list") => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  position: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
  radius: DEFAULT_RADIUS_KM,
  activeCategory: null,
  query: "",
  viewMode: "map",
  setPosition: (pos) => set({ position: pos }),
  setRadius: (radius) => set({ radius }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setQuery: (query) => set({ query }),
  setViewMode: (viewMode) => set({ viewMode }),
  resetFilters: () =>
    set({ activeCategory: null, query: "", radius: DEFAULT_RADIUS_KM }),
}));
