import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSignatory,
  createSignatoryRule,
  deleteSignatoryRule,
  fetchSignatories,
  fetchSignatoryRules,
  previewMatrix,
  updateSignatory,
  updateSignatoryRule,
} from "../api";
import type {
  CreateSignatoryInput,
  CreateSignatoryRuleInput,
  UpdateSignatoryInput,
  UpdateSignatoryRuleInput,
} from "../types";

export const signatoryKeys = {
  all: ["signatories"] as const,
  byCustomer: (customerId: string) => [...signatoryKeys.all, customerId] as const,
  rules: (customerId: string) => [...signatoryKeys.all, "rules", customerId] as const,
  preview: (customerId: string, amount: number) =>
    [...signatoryKeys.all, "preview", customerId, amount] as const,
};

export function useSignatories(customerId: string) {
  return useQuery({
    queryKey: signatoryKeys.byCustomer(customerId),
    queryFn: () => fetchSignatories(customerId),
    enabled: !!customerId,
  });
}

export function useSignatoryRules(customerId: string) {
  return useQuery({
    queryKey: signatoryKeys.rules(customerId),
    queryFn: () => fetchSignatoryRules(customerId),
    enabled: !!customerId,
  });
}

export function useCreateSignatory(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSignatoryInput) => createSignatory(customerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatoryKeys.byCustomer(customerId) });
    },
  });
}

export function useUpdateSignatory(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ signatoryId, input }: { signatoryId: string; input: UpdateSignatoryInput }) =>
      updateSignatory(customerId, signatoryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatoryKeys.byCustomer(customerId) });
    },
  });
}

export function useCreateSignatoryRule(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSignatoryRuleInput) => createSignatoryRule(customerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatoryKeys.rules(customerId) });
    },
  });
}

export function useUpdateSignatoryRule(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: UpdateSignatoryRuleInput }) =>
      updateSignatoryRule(customerId, ruleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatoryKeys.rules(customerId) });
    },
  });
}

export function useDeleteSignatoryRule(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteSignatoryRule(customerId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signatoryKeys.rules(customerId) });
    },
  });
}

export function useMatrixPreview(customerId: string, amount: number, enabled = false) {
  return useQuery({
    queryKey: signatoryKeys.preview(customerId, amount),
    queryFn: () => previewMatrix(customerId, amount),
    enabled: enabled && !!customerId && amount > 0,
  });
}
