import { apiClient } from "@/lib/api-client";
import type {
  CreateSignatoryInput,
  CreateSignatoryRuleInput,
  MatrixPreviewResult,
  Signatory,
  SignatoryRule,
  UpdateSignatoryInput,
  UpdateSignatoryRuleInput,
} from "./types";

export async function fetchSignatories(customerId: string): Promise<Signatory[]> {
  return apiClient<Signatory[]>(`/customers/${customerId}/signatories`);
}

export async function createSignatory(
  customerId: string,
  input: CreateSignatoryInput,
): Promise<Signatory> {
  return apiClient<Signatory>(`/customers/${customerId}/signatories`, {
    method: "POST",
    body: input,
  });
}

export async function updateSignatory(
  customerId: string,
  signatoryId: string,
  input: UpdateSignatoryInput,
): Promise<Signatory> {
  return apiClient<Signatory>(`/customers/${customerId}/signatories/${signatoryId}`, {
    method: "PUT",
    body: input,
  });
}

export async function fetchSignatoryRules(customerId: string): Promise<SignatoryRule[]> {
  return apiClient<SignatoryRule[]>(`/customers/${customerId}/signatory-rules`);
}

export async function createSignatoryRule(
  customerId: string,
  input: CreateSignatoryRuleInput,
): Promise<SignatoryRule> {
  return apiClient<SignatoryRule>(`/customers/${customerId}/signatory-rules`, {
    method: "POST",
    body: input,
  });
}

export async function updateSignatoryRule(
  customerId: string,
  ruleId: string,
  input: UpdateSignatoryRuleInput,
): Promise<SignatoryRule> {
  return apiClient<SignatoryRule>(`/customers/${customerId}/signatory-rules/${ruleId}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteSignatoryRule(customerId: string, ruleId: string): Promise<void> {
  return apiClient<void>(`/customers/${customerId}/signatory-rules/${ruleId}`, {
    method: "DELETE",
  });
}

export async function previewMatrix(
  customerId: string,
  amount: number,
): Promise<MatrixPreviewResult> {
  return apiClient<MatrixPreviewResult>(`/customers/${customerId}/signatory-matrix/preview`, {
    method: "POST",
    body: { amount },
  });
}
