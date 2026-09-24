import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import { orgKeys } from "./keys";

export function useOrgAccounts(orgId: string, options?: { includeUnselected?: boolean }) {
  const includeUnselected = options?.includeUnselected ?? false;
  return useQuery({
    queryKey: orgKeys.accounts(orgId, includeUnselected),
    queryFn: () => api.fetchOrgAccounts(orgId, { includeUnselected }),
    enabled: Boolean(orgId),
  });
}

export function useLinkableAccounts(orgId: string, accountNumber?: string, enabled = true) {
  return useQuery({
    queryKey: orgKeys.linkable(orgId, accountNumber),
    queryFn: () => api.fetchLinkableAccounts(orgId, accountNumber),
    enabled: Boolean(orgId) && enabled,
  });
}

export function useOrgAccountMutations(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...orgKeys.all, orgId, "accounts"] });
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
    link: useMutation({
      mutationFn: (accountNumbers: string[]) => api.linkOrgAccounts(orgId, accountNumbers),
      onSuccess: invalidate,
    }),
    deselect: useMutation({
      mutationFn: (accountId: string) => api.deselectOrgAccount(orgId, accountId),
      onSuccess: invalidate,
    }),
  };
}
