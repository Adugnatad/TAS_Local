import { apiClient } from "@/lib/api-client";
import type {
  ApprovalFeature,
  ApprovalPolicyTemplate,
  ApprovalRule,
  ApprovalTypesResponse,
  CreateApprovalRuleInput,
  MatrixAuditEntry,
  MatrixEvaluation,
  SimulationRequest,
  SimulationResponse,
  SignatoryGroup,
  SignatoryMember,
} from "./types";

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
  input: CreateApprovalRuleInput,
): Promise<ApprovalRule> {
  return apiClient(`${base(orgId)}/approval-rules`, { method: "POST", body: input });
}

export async function updateRule(
  orgId: string,
  ruleId: string,
  input: CreateApprovalRuleInput,
): Promise<ApprovalRule> {
  return apiClient(`${base(orgId)}/approval-rules/${ruleId}`, { method: "PUT", body: input });
}

export async function deleteRule(orgId: string, ruleId: string): Promise<void> {
  return apiClient(`${base(orgId)}/approval-rules/${ruleId}`, { method: "DELETE" });
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

export async function simulateMatrix(
  orgId: string,
  input: SimulationRequest,
): Promise<SimulationResponse> {
  return apiClient(`${base(orgId)}/matrix/simulate`, { method: "POST", body: input });
}

export async function fetchMatrixAudit(orgId: string): Promise<MatrixAuditEntry[]> {
  const data = await apiClient<MatrixAuditEntry[] | { content: MatrixAuditEntry[] }>(
    `${base(orgId)}/matrix/audit`,
  );
  return asArray(data);
}

export async function fetchApprovalTemplates(): Promise<ApprovalPolicyTemplate[]> {
  const data = await apiClient<
    ApprovalPolicyTemplate[] | { content: ApprovalPolicyTemplate[] }
  >("/approval-policy-templates");
  return asArray(data);
}

export async function applyApprovalTemplate(
  orgId: string,
  code: string,
  defaultSignatoryGroupId: string,
): Promise<ApprovalRule[]> {
  const data = await apiClient<ApprovalRule[] | { content: ApprovalRule[] }>(
    `${base(orgId)}/matrix/templates/${code}/apply`,
    { method: "POST", body: { defaultSignatoryGroupId } },
  );
  return asArray(data);
}

export async function fetchApprovalFeatures(): Promise<ApprovalFeature[]> {
  const data = await apiClient<ApprovalFeature[] | { content: ApprovalFeature[] }>(
    "/approval-features",
  );
  return asArray(data);
}

export async function fetchCurrencies(): Promise<string[]> {
  const data = await apiClient<
    string[] | { content: string[] } | { currencies: string[] }
  >("/currencies");
  if (Array.isArray(data)) return data;
  if ("currencies" in data && Array.isArray(data.currencies)) return data.currencies;
  if ("content" in data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function fetchEvaluation(orgId: string, evaluationId: string): Promise<MatrixEvaluation> {
  return apiClient(`${base(orgId)}/matrix/evaluations/${evaluationId}`);
}

export async function fetchAuthorized(orgId: string, requestRef: string): Promise<MatrixEvaluation> {
  return apiClient(`${base(orgId)}/matrix/authorized`, { params: { requestRef } });
}

export async function fetchApprovalTypes(): Promise<ApprovalTypesResponse> {
  const data = await apiClient<
    | ApprovalTypesResponse
    | Array<string | { code?: string; label?: string; name?: string; value?: string }>
    | { content: Array<string | { code?: string; label?: string; name?: string; value?: string }> }
  >("/approval-types");

  if (data && typeof data === "object" && "approvalTypes" in data) {
    return data as ApprovalTypesResponse;
  }

  const items = Array.isArray(data) ? data : (data as { content: unknown[] }).content ?? [];
  const approvalTypes = items
    .map((item) => {
      if (typeof item === "string") return { value: item, label: item };
      const record = item as { code?: string; label?: string; name?: string; value?: string };
      const value = record.code || record.value || record.name || "";
      if (!value) return null;
      return { value, label: record.label || record.name || value };
    })
    .filter((item): item is { value: string; label: string } => Boolean(item));

  return {
    approvalTypes,
    approvalActions: [{ value: "CREATE", label: "CREATE" }],
  };
}
