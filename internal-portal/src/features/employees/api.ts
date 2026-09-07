import { apiClient } from "@/lib/api-client";
import type { ApiListParams, PageResponse } from "@/types/global";
import type { CreateEmployeeInput, Employee, VerifyEmployeeResponse } from "./types";

export async function fetchEmployees(params: ApiListParams): Promise<PageResponse<Employee>> {
  return apiClient("/employees", { params });
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  return apiClient("/employees", { method: "POST", body: input });
}

export async function assignUserRoles(userId: string, roleIds: string[]): Promise<unknown> {
  return apiClient(`/users/${userId}/roles`, { method: "PUT", body: { roleIds } });
}

export async function verifyCse(email: string): Promise<VerifyEmployeeResponse> {
  return apiClient("/employees/verify-cse", { params: { email } });
}

export async function verifyEngineer(email: string): Promise<VerifyEmployeeResponse> {
  return apiClient("/employees/verify-engineer", { params: { email } });
}
