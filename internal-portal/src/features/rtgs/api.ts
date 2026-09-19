import { apiClient } from "@/lib/api-client";
import type { PageResponse } from "@/types/global";
import type { RtgsTransfer } from "./types";

export function fetchAwaitingAcknowledgement(params: { page: number; size: number }) {
  return apiClient<PageResponse<RtgsTransfer>>("/rtgs/transfers/awaiting-acknowledgement", {
    params,
  });
}

export function fetchRtgsTransfer(id: string) {
  return apiClient<RtgsTransfer>(`/rtgs/transfers/${id}`);
}

export function acknowledgeRtgsTransfer(id: string, note?: string) {
  return apiClient<RtgsTransfer>(`/rtgs/transfers/${id}/acknowledge`, {
    method: "POST",
    body: note?.trim() ? { note: note.trim() } : undefined,
  });
}
