import { apiClient } from "@/lib/api-client";
import type { ApiListParams, PageResponse } from "@/types/global";
import type { TradeProcess } from "./types";

function text(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function normalize(row: Record<string, unknown>): TradeProcess {
  return {
    ...row,
    processInstanceId: text(row, "processInstanceId", "id", "processId"),
    status: text(row, "status", "processStatus", "state") || undefined,
    customerName: text(row, "customerName", "organizationName", "customer") || undefined,
    organizationName: text(row, "organizationName") || undefined,
    createdAt: text(row, "createdAt", "created") || undefined,
    updatedAt: text(row, "updatedAt", "lastUpdated") || undefined,
  };
}

function asList(data: unknown): TradeProcess[] {
  const rows = Array.isArray(data)
    ? data
    : ((data as { content?: unknown[]; items?: unknown[]; processes?: unknown[] } | null)?.content ??
      (data as { items?: unknown[] } | null)?.items ??
      (data as { processes?: unknown[] } | null)?.processes ??
      []);
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map(normalize)
    .filter((row) => row.processInstanceId);
}

export async function fetchTradeProcesses(
  params?: ApiListParams,
): Promise<PageResponse<TradeProcess> | TradeProcess[]> {
  const data = await apiClient<PageResponse<TradeProcess> | TradeProcess[] | { content: unknown[] }>(
    "/trade/processes",
    { params },
  );
  if (data && typeof data === "object" && "content" in data && "totalElements" in data) {
    return {
      ...(data as PageResponse<unknown>),
      content: asList((data as PageResponse<unknown>).content),
    } as PageResponse<TradeProcess>;
  }
  return asList(data);
}

export async function fetchCseTradeProcesses(email?: string): Promise<TradeProcess[]> {
  const data = await apiClient<unknown>("/trade/processes/cse", {
    params: email ? { email } : undefined,
  });
  return asList(data);
}

export async function fetchTradeProcess(processInstanceId: string): Promise<TradeProcess> {
  const data = await apiClient<Record<string, unknown>>(
    `/trade/processes/${encodeURIComponent(processInstanceId)}`,
  );
  return normalize(data);
}

export async function fetchTradeFxOptions(): Promise<unknown> {
  return apiClient("/trade-fx-options");
}
