"use client";

import { useReducer, useEffect, useRef } from "react";
import type { ProviderWithDistance, SearchFilters, ApiResponse } from "@/types";

type State = {
  providers: ProviderWithDistance[];
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: "loading" }
  | { type: "success"; payload: ProviderWithDistance[] }
  | { type: "error"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, isLoading: true, error: null };
    case "success": return { providers: action.payload, isLoading: false, error: null };
    case "error":   return { ...state, isLoading: false, error: action.payload };
  }
}

export function useProviders(filters: SearchFilters | null) {
  const [state, dispatch] = useReducer(reducer, {
    providers: [],
    isLoading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!filters) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "loading" });

    const params = new URLSearchParams({
      lat: String(filters.lat),
      lng: String(filters.lng),
      radius_km: String(filters.radius_km),
      ...(filters.category_slug ? { category_slug: filters.category_slug } : {}),
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.sort ? { sort: filters.sort } : {}),
    });

    fetch(`/api/providers?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json: ApiResponse<ProviderWithDistance[]>) => {
        if (controller.signal.aborted) return;
        if (json.error) {
          dispatch({ type: "error", payload: json.error });
        } else {
          dispatch({ type: "success", payload: json.data ?? [] });
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === "AbortError") return;
        dispatch({ type: "error", payload: "Impossible de charger les prestataires" });
      });

    return () => controller.abort();
  }, [filters]);

  return { ...state, reload: () => {} };
}
