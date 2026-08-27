import { useQuery } from "@tanstack/react-query";
import { APPROVAL_TYPES } from "@/lib/constants";
import { fetchApprovalTypes } from "../api";

function normalizeApprovalTypes(
  data: Array<string | { code?: string; label?: string; name?: string; value?: string }> | undefined,
): Array<{ code: string; label: string }> {
  if (!data?.length) {
    return APPROVAL_TYPES.map((code) => ({ code, label: code }));
  }
  return data
    .map((item) => {
      if (typeof item === "string") return { code: item, label: item };
      const code = item.code || item.value || item.name || "";
      if (!code) return null;
      return { code, label: item.label || item.name || code };
    })
    .filter((item): item is { code: string; label: string } => Boolean(item));
}

export function useApprovalTypes() {
  return useQuery({
    queryKey: ["approval-types"],
    queryFn: fetchApprovalTypes,
    select: normalizeApprovalTypes,
    staleTime: 5 * 60_000,
  });
}
