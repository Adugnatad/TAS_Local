import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import * as api from "../api";
import type { CreateOrgUserInput, UpdateOrgUserInput } from "../types";
import { orgKeys } from "./keys";

export function useOrgUsers(orgId: string, params: ApiListParams) {
  return useQuery({
    queryKey: orgKeys.users(orgId, params),
    queryFn: () => api.fetchOrgUsers(orgId, params),
    enabled: Boolean(orgId),
  });
}

export function useCreateOrgUser(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [...orgKeys.all, orgId, "users"] });
  return useMutation({
    mutationFn: (input: CreateOrgUserInput) => api.createOrgUser(orgId, input),
    onSuccess: invalidate,
  });
}

export function useOrgUserMutations(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...orgKeys.all, orgId, "users"] });
    qc.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
  };
  return {
    update: useMutation({
      mutationFn: ({ userId, input }: { userId: string; input: UpdateOrgUserInput }) =>
        api.updateOrgUser(orgId, userId, input),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
        api.setOrgUserActive(orgId, userId, active),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({
      mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
        api.resetOrgUserPassword(orgId, userId, newPassword),
      onSuccess: invalidate,
    }),
  };
}
