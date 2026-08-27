import { useQuery } from "@tanstack/react-query";
import * as api from "../api";
import { matrixKeys } from "./keys";

export function useApprovalRules(
  orgId: string,
  params?: { type?: string; groupId?: string },
) {
  return useQuery({
    queryKey: matrixKeys.rules(orgId, params),
    queryFn: () => api.fetchRules(orgId, params),
    enabled: Boolean(orgId),
  });
}
