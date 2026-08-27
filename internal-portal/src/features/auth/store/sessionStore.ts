import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clearTokens,
  setOnTokensUpdated,
  setOnUnauthorized,
  setTokens,
} from "@/lib/token-store";
import type { SessionUser } from "../types";

interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (user: SessionUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: SessionUser) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      setSession: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      updateUser: (user) => set({ user }),
      clearSession: () => {
        clearTokens();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "tas-portal-session",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user?.userType !== "EMPLOYEE" || !state.accessToken) {
          clearTokens();
          state?.clearSession();
          state?.setHasHydrated(true);
          return;
        }
        setTokens(state.accessToken, state.refreshToken);
        state?.setHasHydrated(true);
      },
    },
  ),
);

setOnUnauthorized(() => {
  useSessionStore.getState().clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
});

setOnTokensUpdated((access, refresh) => {
  // Keep persisted Zustand session in sync when api-client refreshes tokens.
  useSessionStore.setState({
    accessToken: access,
    refreshToken: refresh,
    isAuthenticated: true,
  });
});
