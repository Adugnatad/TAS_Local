import { apiClient } from "@/lib/api-client";
import type { LoanProcess, LoanProcessCollection } from "./loan-process-types";

export async function fetchLoanProcesses(): Promise<LoanProcessCollection> {
  return apiClient("/loans/processes", {
    params: { includeClosed: true, limit: 100, offset: 0 },
  });
}

export function fetchLoanProcess(applicationId: string): Promise<LoanProcess> {
  return apiClient(`/loans/processes/${encodeURIComponent(applicationId)}`);
}

export function fetchLoanProcessStatus(applicationId: string): Promise<unknown> {
  return apiClient(`/loans/processes/${encodeURIComponent(applicationId)}/status`);
}

export function deactivateLoanProcess(applicationId: string): Promise<unknown> {
  return apiClient(`/loans/processes/${encodeURIComponent(applicationId)}/deactivate`, {
    method: "POST",
  });
}

export function loanProcessId(process: LoanProcess): string {
  return String(process.coopstreamApplicationId ?? process.applicationId ?? process.id ?? "");
}

export function loanProcessRows(data: LoanProcessCollection | undefined): LoanProcess[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.processes ?? data.items ?? data.content ?? [];
}
