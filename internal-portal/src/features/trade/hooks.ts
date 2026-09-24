import { useQuery } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import * as api from "./api";

export const tradeKeys = {
  all: ["trade"] as const,
  list: (params?: unknown) => [...tradeKeys.all, "list", params] as const,
  cse: (email?: string) => [...tradeKeys.all, "cse", email ?? ""] as const,
  detail: (id: string) => [...tradeKeys.all, "detail", id] as const,
  fx: [...["trade"], "fx"] as const,
};

export function useTradeProcesses(params?: ApiListParams) {
  return useQuery({
    queryKey: tradeKeys.list(params),
    queryFn: () => api.fetchTradeProcesses(params),
  });
}

export function useCseTradeProcesses(email?: string, enabled = true) {
  return useQuery({
    queryKey: tradeKeys.cse(email),
    queryFn: () => api.fetchCseTradeProcesses(email),
    enabled,
  });
}

export function useTradeProcess(processInstanceId: string) {
  return useQuery({
    queryKey: tradeKeys.detail(processInstanceId),
    queryFn: () => api.fetchTradeProcess(processInstanceId),
    enabled: Boolean(processInstanceId),
  });
}

export function useTradeFxOptions() {
  return useQuery({
    queryKey: tradeKeys.fx,
    queryFn: () => api.fetchTradeFxOptions(),
    staleTime: 5 * 60_000,
  });
}
