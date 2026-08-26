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

export function useCreateOrgAccount(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: orgKeys.accounts(orgId) });
    qc.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
  };
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof api.createOrgAccount>[1]) =>
        api.createOrgAccount(orgId, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        accountId,
        input,
      }: {
        accountId: string;
        input: Parameters<typeof api.updateOrgAccount>[2];
      }) => api.updateOrgAccount(orgId, accountId, input),
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
