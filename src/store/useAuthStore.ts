import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  phone: string | null;
  providerId: string | null;
  isAuthenticated: boolean;
  login: (phone: string, providerId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      phone: null,
      providerId: null,
      isAuthenticated: false,
      login: (phone, providerId) =>
        set({ phone, providerId, isAuthenticated: true }),
      logout: () =>
        set({ phone: null, providerId: null, isAuthenticated: false }),
    }),
    { name: "nearyou-auth" }
  )
);
