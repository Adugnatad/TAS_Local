import { useQuery } from "@tanstack/react-query";
import { fetchRequest, fetchRequests } from "../api";
import type { RequestListParams } from "../types";

export const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (params: RequestListParams) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
};

export function useRequests(params: RequestListParams = {}) {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: () => fetchRequests(params),
  });
}

export function useRequest(requestId: string) {
  return useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: () => fetchRequest(requestId),
    enabled: !!requestId,
  });
}
