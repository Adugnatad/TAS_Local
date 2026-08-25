import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import * as api from "./api";
import type { LoanPayload } from "./types";

export const loanKeys = {
  list: (orgId: string, params?: unknown) => ["loans", orgId, params] as const,
  detail: (orgId: string, id: string) => ["loans", orgId, id] as const,
  catalogs: ["catalogs"] as const,
};

export function useLoanRequests(orgId: string, params?: ApiListParams) {
  return useQuery({
    queryKey: loanKeys.list(orgId, params),
    queryFn: () => api.fetchLoanRequests(orgId, params),
    enabled: Boolean(orgId),
  });
}

export function useLoanRequest(orgId: string, id: string) {
  return useQuery({
    queryKey: loanKeys.detail(orgId, id),
    queryFn: () => api.fetchLoanRequest(orgId, id),
    enabled: Boolean(orgId && id),
  });
}

export function useCatalogs() {
  return useQuery({
    queryKey: loanKeys.catalogs,
    queryFn: async () => ({
      products: await api.fetchProductCatalog(),
      businessTypes: await api.fetchBusinessTypes(),
    }),
  });
}

export function useLoanMutations(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["loans", orgId] });
  return {
    create: useMutation({
      mutationFn: (body: LoanPayload) => api.createLoanRequest(orgId, body),
      onSuccess: invalidate,
    }),
    submit: useMutation({
      mutationFn: (id: string) => api.submitLoanRequest(orgId, id),
      onSuccess: invalidate,
    }),
  };
}
