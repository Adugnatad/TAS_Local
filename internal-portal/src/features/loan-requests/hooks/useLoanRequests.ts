import { useQuery } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import * as api from "../api";

export const loanKeys = {
  list: (orgId: string, params?: unknown) => ["loans", orgId, params] as const,
  detail: (orgId: string, id: string) => ["loans", orgId, id] as const,
  catalogs: ["catalogs"] as const,
  enums: ["loan-request-enums"] as const,
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

export function useLoanRequestEnums() {
  return useQuery({
    queryKey: loanKeys.enums,
    queryFn: () => api.fetchLoanRequestEnums(),
  });
}
