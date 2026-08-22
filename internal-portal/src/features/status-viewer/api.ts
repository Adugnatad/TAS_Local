import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/global";
import type { RequestListParams, RequestStatusDetail, RequestStatusSummary } from "./types";

export async function fetchRequests(
  params: RequestListParams = {},
): Promise<PaginatedResponse<RequestStatusSummary>> {
  return apiClient<PaginatedResponse<RequestStatusSummary>>("/requests", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function fetchRequest(requestId: string): Promise<RequestStatusDetail> {
  return apiClient<RequestStatusDetail>(`/requests/${requestId}`);
}
