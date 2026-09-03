import { useQuery } from "@tanstack/react-query";
import { fetchApprovalTemplates } from "../api";

export function useApprovalTemplates() {
  return useQuery({
    queryKey: ["approval-policy-templates"],
    queryFn: fetchApprovalTemplates,
    staleTime: 5 * 60_000,
  });
}
