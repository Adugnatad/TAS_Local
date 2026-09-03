import { useQuery } from "@tanstack/react-query";
import { fetchApprovalFeatures } from "../api";

export function useApprovalFeatures() {
  return useQuery({
    queryKey: ["approval-features"],
    queryFn: fetchApprovalFeatures,
    staleTime: 5 * 60_000,
  });
}
