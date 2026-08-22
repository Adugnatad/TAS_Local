import { useSessionStore } from "../store/sessionStore";

export function useSession() {
  const user = useSessionStore((state) => state.user);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const hasHydrated = useSessionStore((state) => state.hasHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const hasRole = (...roles: Array<NonNullable<typeof user>["role"]>) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    user,
    isAuthenticated,
    hasHydrated,
    setSession,
    clearSession,
    hasRole,
  };
}
