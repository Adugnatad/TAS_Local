import { useSession } from "@/features/auth/hooks/useSession";

export function useCan(permission: string): boolean {
  return useSession().can(permission);
}
