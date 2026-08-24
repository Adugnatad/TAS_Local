import { DEFAULT_ROLE_PERMISSIONS, type Capability } from "@/lib/constants";
import { useSession } from "@/features/auth/hooks/useSession";
import { useRolePermissions } from "./useSettings";

export function useCan(capability: Capability): boolean {
  const { user } = useSession();
  const { data } = useRolePermissions();
  if (!user) return false;
  const granted = data?.[user.role] ?? DEFAULT_ROLE_PERMISSIONS[user.role];
  return granted.includes(capability);
}
