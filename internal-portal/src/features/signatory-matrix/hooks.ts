import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

export const matrixKeys = {
  groups: (orgId: string) => ["signatory", orgId, "groups"] as const,
  members: (orgId: string, groupId: string) => ["signatory", orgId, "members", groupId] as const,
  rules: (orgId: string, params?: unknown) => ["signatory", orgId, "rules", params ?? {}] as const,
};

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

export function useMatrixMutations(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["signatory", orgId] });
  return {
    createGroup: useMutation({
      mutationFn: (input: { name: string; description?: string }) => api.createGroup(orgId, input),
      onSuccess: invalidate,
    }),
    updateGroup: useMutation({
      mutationFn: ({
        groupId,
        ...input
      }: {
        groupId: string;
        name: string;
        description?: string;
      }) => api.updateGroup(orgId, groupId, input),
      onSuccess: invalidate,
    }),
    setGroupActive: useMutation({
      mutationFn: ({ groupId, active }: { groupId: string; active: boolean }) =>
        api.setGroupActive(orgId, groupId, active),
      onSuccess: invalidate,
    }),
    addMember: useMutation({
      mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
        api.addMember(orgId, groupId, userId),
      onSuccess: invalidate,
    }),
    removeMember: useMutation({
      mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
        api.removeMember(orgId, groupId, memberId),
      onSuccess: invalidate,
    }),
    reorderMembers: useMutation({
      mutationFn: ({ groupId, orderedUserIds }: { groupId: string; orderedUserIds: string[] }) =>
        api.reorderMembers(orgId, groupId, orderedUserIds),
      onSuccess: invalidate,
    }),
    createRule: useMutation({
      mutationFn: (input: Parameters<typeof api.createRule>[1]) => api.createRule(orgId, input),
      onSuccess: invalidate,
    }),
    updateRule: useMutation({
      mutationFn: ({
        ruleId,
        ...input
      }: {
        ruleId: string;
      } & Parameters<typeof api.updateRule>[2]) => api.updateRule(orgId, ruleId, input),
      onSuccess: invalidate,
    }),
    setRuleActive: useMutation({
      mutationFn: ({ ruleId, active }: { ruleId: string; active: boolean }) =>
        api.setRuleActive(orgId, ruleId, active),
      onSuccess: invalidate,
    }),
    evaluate: useMutation({
      mutationFn: (input: Parameters<typeof api.evaluateMatrix>[1]) =>
        api.evaluateMatrix(orgId, input),
    }),
  };
}
