import { apiClient } from "@/lib/api-client";
import type { PageResponse } from "@/types/global";
import type { PermissionCatalogItem, PortalRole } from "./types";

export async function fetchRoles(params: {
  scope?: string;
  q?: string;
}): Promise<PortalRole[]> {
  const data = await apiClient<PortalRole[] | PageResponse<PortalRole>>("/roles", { params });
  return Array.isArray(data) ? data : data.content;
}

export async function fetchRole(id: string): Promise<PortalRole> {
  return apiClient(`/roles/${id}`);
}

export async function createRole(input: {
  name: string;
  scope: string;
  description?: string;
  permissions: string[];
}): Promise<PortalRole> {
  return apiClient("/roles", { method: "POST", body: input });
}

export async function updateRole(
  id: string,
  input: { description?: string; permissions: string[] },
): Promise<PortalRole> {
  return apiClient(`/roles/${id}`, { method: "PUT", body: input });
}

export async function setRoleActive(id: string, active: boolean): Promise<PortalRole> {
  return apiClient(`/roles/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
}

export async function fetchPermissions(): Promise<PermissionCatalogItem[]> {
  return apiClient("/permissions");
}
