import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import { orgKeys } from "./keys";

export function useOrgAccounts(orgId: string) {
  return useQuery({
    queryKey: orgKeys.accounts(orgId),
    queryFn: () => api.fetchOrgAccounts(orgId),
    enabled: Boolean(orgId),
  });
}

export function useOrgAccountMutations(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: orgKeys.accounts(orgId) });
    qc.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
  };
  return {
    refresh: useMutation({
      mutationFn: () => api.refreshOrgAccounts(orgId),
      onSuccess: invalidate,
    }),
    setPrimary: useMutation({
      mutationFn: (accountId: string) => api.setPrimaryOrgAccount(orgId, accountId),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (accountId: string) => api.deleteOrgAccount(orgId, accountId),
      onSuccess: invalidate,
    }),
  };
}
