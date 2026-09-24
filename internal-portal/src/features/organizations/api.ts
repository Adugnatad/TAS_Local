import { apiClient, apiDownload } from "@/lib/api-client";
import type { ApiListParams, PageResponse } from "@/types/global";
import type { OrgStatus } from "@/lib/constants";
import type {
  CreateOrgUserInput,
  OrgAccount,
  OrgAccountInput,
  OrgDocument,
  DocumentTypeOption,
  AccountLookupResponse,
  LinkableAccountsResponse,
  OrganizationDetail,
  OrganizationSummary,
  OrganizationUser,
  OrganizationWritePayload,
  UpdateOrgUserInput,
} from "./types";

export async function fetchOrganizations(
  params: ApiListParams & { status?: OrgStatus | "" },
): Promise<PageResponse<OrganizationSummary>> {
  return apiClient("/organizations", { params });
}

export async function fetchOrganization(id: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}`);
}

export async function createOrganization(
  payload: OrganizationWritePayload,
  businessLicense?: File | null,
): Promise<OrganizationDetail> {
  const form = new FormData();
  form.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  if (businessLicense) {
    form.append("businessLicense", businessLicense);
  }
  return apiClient("/organizations", { method: "POST", body: form });
}

export async function updateOrganization(
  id: string,
  payload: OrganizationWritePayload,
): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}`, { method: "PUT", body: payload });
}

export async function suspendOrganization(id: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/suspend`, { method: "POST" });
}

export async function activateOrganization(id: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/activate`, { method: "POST" });
}

export async function terminateOrganization(id: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/terminate`, { method: "POST" });
}

export async function deleteOrganization(id: string): Promise<void> {
  return apiClient(`/organizations/${id}`, { method: "DELETE" });
}

export async function revalidateOrganization(id: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/revalidate`, { method: "POST" });
}

export async function verifyTin(id: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/verify-tin`, { method: "POST" });
}

export async function verifyManual(id: string, note: string): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/verify-manual`, { method: "POST", body: { note } });
}

export async function assignOrganizationCse(
  id: string,
  cseUserId: string,
): Promise<OrganizationDetail> {
  return apiClient(`/organizations/${id}/assign-cse`, {
    method: "POST",
    body: { cseUserId },
  });
}

export async function fetchOrgUsers(
  orgId: string,
  params: ApiListParams,
): Promise<PageResponse<OrganizationUser>> {
  return apiClient(`/organizations/${orgId}/users`, { params });
}

export async function createOrgUser(
  orgId: string,
  input: CreateOrgUserInput,
): Promise<OrganizationUser> {
  return apiClient(`/organizations/${orgId}/users`, { method: "POST", body: input });
}

export async function updateOrgUser(
  orgId: string,
  userId: string,
  input: UpdateOrgUserInput,
): Promise<OrganizationUser> {
  return apiClient(`/organizations/${orgId}/users/${userId}`, { method: "PUT", body: input });
}

export async function setOrgUserActive(
  orgId: string,
  userId: string,
  active: boolean,
): Promise<OrganizationUser> {
  return apiClient(
    `/organizations/${orgId}/users/${userId}/${active ? "activate" : "deactivate"}`,
    { method: "POST" },
  );
}

export async function resetOrgUserPassword(
  orgId: string,
  userId: string,
  newPassword: string,
): Promise<void> {
  return apiClient(`/organizations/${orgId}/users/${userId}/reset-password`, {
    method: "POST",
    body: { newPassword },
  });
}

export async function fetchOrgAccounts(
  orgId: string,
  options?: { includeUnselected?: boolean },
): Promise<OrgAccount[]> {
  const data = await apiClient<OrgAccount[] | { content: OrgAccount[] }>(
    `/organizations/${orgId}/accounts`,
    { params: options?.includeUnselected ? { includeUnselected: true } : undefined },
  );
  return Array.isArray(data) ? data : data.content;
}

export async function fetchLinkableAccounts(
  orgId: string,
  accountNumber?: string,
): Promise<LinkableAccountsResponse> {
  return apiClient(`/organizations/${orgId}/accounts/linkable`, {
    params: accountNumber ? { accountNumber } : undefined,
  });
}

export async function linkOrgAccounts(
  orgId: string,
  accountNumbers: string[],
): Promise<OrgAccount[]> {
  const data = await apiClient<OrgAccount[] | { content: OrgAccount[] }>(
    `/organizations/${orgId}/accounts`,
    { method: "POST", body: { accountNumbers } },
  );
  return Array.isArray(data) ? data : data.content;
}

export async function deselectOrgAccount(orgId: string, accountId: string): Promise<OrgAccount> {
  return apiClient(`/organizations/${orgId}/accounts/${accountId}/deselect`, { method: "POST" });
}

export async function lookupAccount(accountNumber: string): Promise<AccountLookupResponse> {
  return apiClient("/organizations/account-lookup", { params: { accountNumber } });
}

export async function refreshOrgAccounts(orgId: string): Promise<OrgAccount[]> {
  const data = await apiClient<OrgAccount[] | { content: OrgAccount[] }>(
    `/organizations/${orgId}/accounts/refresh`,
    { method: "POST" },
  );
  return Array.isArray(data) ? data : data.content;
}

export async function createOrgAccount(
  orgId: string,
  input: OrgAccountInput,
): Promise<OrgAccount> {
  return apiClient(`/organizations/${orgId}/accounts`, { method: "POST", body: input });
}

export async function updateOrgAccount(
  orgId: string,
  accountId: string,
  input: OrgAccountInput,
): Promise<OrgAccount> {
  return apiClient(`/organizations/${orgId}/accounts/${accountId}`, {
    method: "PUT",
    body: input,
  });
}

export async function setPrimaryOrgAccount(orgId: string, accountId: string): Promise<OrgAccount> {
  return apiClient(`/organizations/${orgId}/accounts/${accountId}/set-primary`, { method: "POST" });
}

export async function deleteOrgAccount(orgId: string, accountId: string): Promise<void> {
  return apiClient(`/organizations/${orgId}/accounts/${accountId}`, { method: "DELETE" });
}

export async function fetchOrgDocuments(orgId: string): Promise<OrgDocument[]> {
  const data = await apiClient<OrgDocument[] | { content: OrgDocument[] }>(
    `/organizations/${orgId}/documents`,
  );
  return Array.isArray(data) ? data : data.content;
}

export async function fetchDocumentTypes(): Promise<DocumentTypeOption[]> {
  const data = await apiClient<
    | DocumentTypeOption[]
    | Array<string | { code?: string; name?: string; label?: string; value?: string }>
    | { content: Array<string | { code?: string; name?: string; label?: string; value?: string }> }
  >("/document-types");
  const items = Array.isArray(data) ? data : data.content;
  return items
    .map((item) => {
      if (typeof item === "string") return { code: item, label: item };
      if ("code" in item && "label" in item && item.code && item.label) {
        return { code: String(item.code), label: String(item.label) };
      }
      const code = String(
        (item as { code?: string; value?: string; name?: string }).code ||
          (item as { value?: string }).value ||
          (item as { name?: string }).name ||
          "",
      );
      if (!code) return null;
      const label = String(
        (item as { label?: string; name?: string }).label ||
          (item as { name?: string }).name ||
          code,
      );
      return { code, label };
    })
    .filter((item): item is DocumentTypeOption => Boolean(item));
}

export async function uploadOrgDocument(
  orgId: string,
  file: File,
  options: { type: string; documentName?: string },
): Promise<OrganizationDetail | unknown> {
  const form = new FormData();
  form.append("file", file);
  return apiClient(`/organizations/${orgId}/documents`, {
    method: "POST",
    body: form,
    params: {
      type: options.type,
      documentName: options.documentName,
    },
  });
}

export async function uploadBusinessLicense(
  orgId: string,
  file: File,
): Promise<OrganizationDetail | unknown> {
  const form = new FormData();
  form.append("file", file);
  return apiClient(`/organizations/${orgId}/business-license`, {
    method: "POST",
    body: form,
  });
}

export async function downloadOrgDocument(orgId: string, documentId: string): Promise<void> {
  const { blob, filename } = await apiDownload(
    `/organizations/${orgId}/documents/${documentId}`,
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? "document";
  link.click();
  URL.revokeObjectURL(url);
}

export async function deleteOrgDocument(orgId: string, documentId: string): Promise<void> {
  return apiClient(`/organizations/${orgId}/documents/${documentId}`, { method: "DELETE" });
}
