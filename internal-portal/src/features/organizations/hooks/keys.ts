import type { ApiListParams } from "@/types/global";

export const orgKeys = {
  all: ["organizations"] as const,
  list: (params: unknown) => [...orgKeys.all, "list", params] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
  users: (id: string, params: unknown) => [...orgKeys.all, id, "users", params] as const,
  accounts: (id: string, includeUnselected?: boolean) =>
    [...orgKeys.all, id, "accounts", { includeUnselected }] as const,
  linkable: (id: string, accountNumber?: string) =>
    [...orgKeys.all, id, "accounts", "linkable", accountNumber ?? ""] as const,
  documents: (id: string, includeHistory?: boolean) =>
    [...orgKeys.all, id, "documents", { includeHistory }] as const,
};

export type OrgListParams = ApiListParams & { status?: import("@/lib/constants").OrgStatus | "" };
