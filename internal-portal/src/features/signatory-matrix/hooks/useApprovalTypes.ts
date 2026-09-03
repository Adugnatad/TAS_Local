import { useQuery } from "@tanstack/react-query";
import { APPROVAL_TYPES } from "@/lib/constants";
import { fetchApprovalTypes } from "../api";

export function useApprovalTypes() {
  return useQuery({
    queryKey: ["approval-types"],
    queryFn: fetchApprovalTypes,
    staleTime: 5 * 60_000,
  });
}

export function useApprovalTypeOptions() {
  const query = useApprovalTypes();
  const approvalTypes =
    query.data?.approvalTypes?.length
      ? query.data.approvalTypes.map((t) => ({ code: t.value, label: t.label }))
      : APPROVAL_TYPES.map((code) => ({ code, label: code }));
  const approvalActions =
    query.data?.approvalActions?.length
      ? query.data.approvalActions.map((a) => ({ code: a.value, label: a.label }))
      : [{ code: "CREATE", label: "CREATE" }];
  return { ...query, approvalTypes, approvalActions };
}
