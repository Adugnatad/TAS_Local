import { apiClient } from "@/lib/api-client";
import type { ApprovalRule, MatrixEvaluation, SignatoryGroup, SignatoryMember } from "./types";

const base = (orgId: string) => `/organizations/${orgId}`;

function asArray<T>(data: T[] | { content: T[] }): T[] {
  return Array.isArray(data) ? data : data.content;
}

export async function fetchGroups(orgId: string): Promise<SignatoryGroup[]> {
  const data = await apiClient<SignatoryGroup[] | { content: SignatoryGroup[] }>(
    `${base(orgId)}/signatory-groups`,
  );
  return asArray(data);
}

export async function createGroup(
  orgId: string,
  input: { name: string; description?: string },
): Promise<SignatoryGroup> {
  return apiClient(`${base(orgId)}/signatory-groups`, { method: "POST", body: input });
}

export async function updateGroup(
  orgId: string,
  groupId: string,
  input: { name: string; description?: string },
): Promise<SignatoryGroup> {
  return apiClient(`${base(orgId)}/signatory-groups/${groupId}`, { method: "PUT", body: input });
}

export async function setGroupActive(
  orgId: string,
  groupId: string,
  active: boolean,
): Promise<SignatoryGroup> {
  return apiClient(
    `${base(orgId)}/signatory-groups/${groupId}/${active ? "activate" : "deactivate"}`,
    { method: "POST" },
  );
}

export async function fetchMembers(orgId: string, groupId: string): Promise<SignatoryMember[]> {
  const data = await apiClient<SignatoryMember[] | { content: SignatoryMember[] }>(
    `${base(orgId)}/signatory-groups/${groupId}/members`,
  );
  return asArray(data);
}

export async function addMember(
  orgId: string,
  groupId: string,
  userId: string,
): Promise<SignatoryMember> {
  return apiClient(`${base(orgId)}/signatory-groups/${groupId}/members`, {
    method: "POST",
    body: { userId },
  });
}

export async function removeMember(
  orgId: string,
  groupId: string,
  memberId: string,
): Promise<void> {
  return apiClient(`${base(orgId)}/signatory-groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function reorderMembers(
  orgId: string,
  groupId: string,
  orderedUserIds: string[],
): Promise<SignatoryMember[] | void> {
  return apiClient(`${base(orgId)}/signatory-groups/${groupId}/members/reorder`, {
    method: "POST",
    body: { orderedUserIds },
  });
}

export async function fetchRules(
  orgId: string,
  params?: { type?: string; groupId?: string },
): Promise<ApprovalRule[]> {
  const data = await apiClient<ApprovalRule[] | { content: ApprovalRule[] }>(
    `${base(orgId)}/approval-rules`,
    { params },
  );
  return asArray(data);
}

export async function createRule(
  orgId: string,
  input: {
    approvalType: string;
    approvalAction: string;
    minAmount: number;
    maxAmount: number;
    signatoryGroupId: string;
  },
): Promise<ApprovalRule> {
  return apiClient(`${base(orgId)}/approval-rules`, { method: "POST", body: input });
}

export async function updateRule(
  orgId: string,
  ruleId: string,
  input: {
    approvalType: string;
    approvalAction: string;
    minAmount: number;
    maxAmount: number;
    signatoryGroupId: string;
  },
): Promise<ApprovalRule> {
  return apiClient(`${base(orgId)}/approval-rules/${ruleId}`, { method: "PUT", body: input });
}

export async function setRuleActive(
  orgId: string,
  ruleId: string,
  active: boolean,
): Promise<ApprovalRule> {
  return apiClient(
    `${base(orgId)}/approval-rules/${ruleId}/${active ? "activate" : "deactivate"}`,
    { method: "POST" },
  );
}

export async function evaluateMatrix(
  orgId: string,
  input: { approvalType: string; approvalAction: string; amount: number; requestRef?: string },
): Promise<MatrixEvaluation> {
  return apiClient(`${base(orgId)}/matrix/evaluate`, { method: "POST", body: input });
}

export async function fetchEvaluation(orgId: string, evaluationId: string): Promise<MatrixEvaluation> {
  return apiClient(`${base(orgId)}/matrix/evaluations/${evaluationId}`);
}

export async function fetchAuthorized(orgId: string, requestRef: string): Promise<unknown> {
  return apiClient(`${base(orgId)}/matrix/authorized`, { params: { requestRef } });
}
