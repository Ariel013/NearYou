"use client";

import { useState, useCallback } from "react";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/types";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    isLoading: false,
  });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "La géolocalisation n'est pas supportée par ce navigateur",
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
      }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null,
          isLoading: false,
        });
      },
      () => {
        setState({
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
          error: "Position non disponible — utilisation de la position par défaut",
          isLoading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ...state, retry: request };
}
