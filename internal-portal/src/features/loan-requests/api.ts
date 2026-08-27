import { apiClient } from "@/lib/api-client";
import type { ApiListParams, PageResponse } from "@/types/global";
import type { LoanRequest } from "./types";

export async function fetchLoanRequests(
  orgId: string,
  params?: ApiListParams,
): Promise<PageResponse<LoanRequest> | LoanRequest[]> {
  return apiClient(`/organizations/${orgId}/loan-requests`, { params });
}

export async function fetchLoanRequest(orgId: string, id: string): Promise<LoanRequest> {
  return apiClient(`/organizations/${orgId}/loan-requests/${id}`);
}

export async function fetchProductCatalog(): Promise<unknown> {
  return apiClient("/product-catalog");
}

export async function fetchBusinessTypes(): Promise<unknown> {
  return apiClient("/business-types");
}

export async function fetchLoanRequestEnums(): Promise<unknown> {
  return apiClient("/loan-request-enums");
}
