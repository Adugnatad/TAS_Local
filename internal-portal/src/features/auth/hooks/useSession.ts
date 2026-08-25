import { hasAnyPermission, hasPermission } from "@/lib/permissions";
import { useSessionStore } from "../store/sessionStore";

export function useSession() {
  const user = useSessionStore((state) => state.user);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const hasHydrated = useSessionStore((state) => state.hasHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const updateUser = useSessionStore((state) => state.updateUser);
  const clearSession = useSessionStore((state) => state.clearSession);

  const can = (code: string) => hasPermission(user?.permissions, code);
  const canAny = (...codes: string[]) => hasAnyPermission(user?.permissions, codes);

  return {
    user,
    isAuthenticated,
    hasHydrated,
    setSession,
    updateUser,
    clearSession,
    can,
    canAny,
  };
}
