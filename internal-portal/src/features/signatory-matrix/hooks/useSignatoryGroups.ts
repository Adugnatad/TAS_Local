import { useQuery } from "@tanstack/react-query";
import * as api from "../api";
import { matrixKeys } from "./keys";

export function useSignatoryGroups(orgId: string) {
  return useQuery({
    queryKey: matrixKeys.groups(orgId),
    queryFn: () => api.fetchGroups(orgId),
    enabled: Boolean(orgId),
  });
}

export function useSignatoryMembers(orgId: string, groupId: string) {
  return useQuery({
    queryKey: matrixKeys.members(orgId, groupId),
    queryFn: () => api.fetchMembers(orgId, groupId),
    enabled: Boolean(orgId && groupId),
  });
}
