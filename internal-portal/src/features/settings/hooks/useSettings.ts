import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSignatoryTitle,
  fetchRolePermissions,
  fetchSignatoryTitles,
  updateRolePermissions,
  updateSignatoryTitle,
} from "../api";
import type { Capability, OfficerRole } from "@/lib/constants";
import type { SignatoryTitle } from "@/features/signatory-matrix/types";

export const settingsKeys = {
  titles: ["settings", "signatory-titles"] as const,
  permissions: ["settings", "role-permissions"] as const,
};

export function useSignatoryTitles() {
  return useQuery({
    queryKey: settingsKeys.titles,
    queryFn: fetchSignatoryTitles,
  });
}

export function useCreateSignatoryTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSignatoryTitle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.titles }),
  });
}

export function useUpdateSignatoryTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ titleId, input }: { titleId: string; input: Partial<SignatoryTitle> }) =>
      updateSignatoryTitle(titleId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.titles }),
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: settingsKeys.permissions,
    queryFn: fetchRolePermissions,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<OfficerRole, Capability[]>) => updateRolePermissions(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.permissions }),
  });
}
