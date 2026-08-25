import { apiClient } from "@/lib/api-client";
import type { ApiListParams, PageResponse } from "@/types/global";
import type { LoanPayload, LoanRequest } from "./types";

export async function fetchLoanRequests(
  orgId: string,
  params?: ApiListParams,
): Promise<PageResponse<LoanRequest> | LoanRequest[]> {
  return apiClient(`/organizations/${orgId}/loan-requests`, { params });
}

export async function fetchLoanRequest(orgId: string, id: string): Promise<LoanRequest> {
  return apiClient(`/organizations/${orgId}/loan-requests/${id}`);
}

export async function createLoanRequest(orgId: string, body: LoanPayload): Promise<LoanRequest> {
  return apiClient(`/organizations/${orgId}/loan-requests`, { method: "POST", body });
}

export async function submitLoanRequest(orgId: string, id: string): Promise<LoanRequest> {
  return apiClient(`/organizations/${orgId}/loan-requests/${id}/submit`, { method: "POST" });
}

export async function fetchProductCatalog(): Promise<unknown> {
  return apiClient("/product-catalog");
}

export async function fetchBusinessTypes(): Promise<unknown> {
  return apiClient("/business-types");
}
