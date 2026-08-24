import { apiClient } from "@/lib/api-client";
import type { Capability, OfficerRole } from "@/lib/constants";
import type { SignatoryTitle } from "@/features/signatory-matrix/types";

export async function fetchSignatoryTitles(): Promise<SignatoryTitle[]> {
  return apiClient<SignatoryTitle[]>("/settings/signatory-titles");
}

export async function createSignatoryTitle(input: {
  name: string;
  isActive?: boolean;
}): Promise<SignatoryTitle> {
  return apiClient<SignatoryTitle>("/settings/signatory-titles", {
    method: "POST",
    body: input,
  });
}

export async function updateSignatoryTitle(
  titleId: string,
  input: Partial<Pick<SignatoryTitle, "name" | "isActive">>,
): Promise<SignatoryTitle> {
  return apiClient<SignatoryTitle>(`/settings/signatory-titles/${titleId}`, {
    method: "PUT",
    body: input,
  });
}

export async function fetchRolePermissions(): Promise<Record<OfficerRole, Capability[]>> {
  return apiClient<Record<OfficerRole, Capability[]>>("/settings/role-permissions");
}

export async function updateRolePermissions(
  input: Record<OfficerRole, Capability[]>,
): Promise<Record<OfficerRole, Capability[]>> {
  return apiClient<Record<OfficerRole, Capability[]>>("/settings/role-permissions", {
    method: "PUT",
    body: input,
  });
}
