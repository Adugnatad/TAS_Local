import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

export const roleKeys = {
  all: ["roles"] as const,
  list: (params: unknown) => [...roleKeys.all, "list", params] as const,
  permissions: ["permissions"] as const,
};

export function useRoles(params: { scope?: string; q?: string }) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => api.fetchRoles(params),
  });
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: roleKeys.permissions,
    queryFn: api.fetchPermissions,
  });
}

export function useRoleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: roleKeys.all });
  return {
    create: useMutation({ mutationFn: api.createRole, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: {
        id: string;
        description?: string;
        permissions: string[];
      }) => api.updateRole(id, input),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => api.setRoleActive(id, active),
      onSuccess: invalidate,
    }),
  };
}
