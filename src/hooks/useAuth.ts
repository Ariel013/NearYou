"use client";

import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  return useAuthStore();
}
