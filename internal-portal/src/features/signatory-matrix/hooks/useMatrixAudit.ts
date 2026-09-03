import { useQuery } from "@tanstack/react-query";
import { fetchMatrixAudit } from "../api";
import { matrixKeys } from "./keys";

export function useMatrixAudit(orgId: string) {
  return useQuery({
    queryKey: matrixKeys.audit(orgId),
    queryFn: () => fetchMatrixAudit(orgId),
    enabled: Boolean(orgId),
  });
}
