import type { ApiListParams } from "@/types/global";

export const orgKeys = {
  all: ["organizations"] as const,
  list: (params: unknown) => [...orgKeys.all, "list", params] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
  users: (id: string, params: unknown) => [...orgKeys.all, id, "users", params] as const,
  accounts: (id: string) => [...orgKeys.all, id, "accounts"] as const,
  documents: (id: string) => [...orgKeys.all, id, "documents"] as const,
};

export type OrgListParams = ApiListParams & { status?: import("@/lib/constants").OrgStatus | "" };
