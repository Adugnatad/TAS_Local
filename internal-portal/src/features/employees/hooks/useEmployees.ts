import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import * as api from "../api";
import type { CreateEmployeeInput } from "../types";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (params: ApiListParams) => [...employeeKeys.all, params] as const,
};

export function useEmployees(params: ApiListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => api.fetchEmployees(params),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => api.createEmployee(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useAssignUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      api.assignUserRoles(userId, roleIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useVerifyEmployeeId() {
  return useMutation({
    mutationFn: ({
      type,
      email,
    }: {
      type: "cse" | "engineer";
      email: string;
    }) =>
      type === "cse" ? api.verifyCse(email) : api.verifyEngineer(email),
  });
}
