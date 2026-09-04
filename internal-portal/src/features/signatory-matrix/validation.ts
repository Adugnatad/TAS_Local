import type { ApprovalAction, ApprovalRule, MatrixEvaluation, TransactionType } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeApprovalActions(value: {
  approvalActions?: ApprovalAction[] | null;
  approvalAction?: ApprovalAction | null;
}): ApprovalAction[] {
  if (Array.isArray(value.approvalActions) && value.approvalActions.length > 0) {
    return value.approvalActions;
  }
  return value.approvalAction ? [value.approvalAction] : [];
}

export function normalizeApprovalRule(rule: ApprovalRule): ApprovalRule {
  const approvalActions = normalizeApprovalActions(rule);
  return { ...rule, approvalActions, approvalAction: approvalActions[0] };
}

export function normalizeMatrixEvaluation(evaluation: MatrixEvaluation): MatrixEvaluation {
  const approvalActions = normalizeApprovalActions(evaluation);
  return { ...evaluation, approvalActions, approvalAction: approvalActions[0] };
}

export function isPerTransactionOnlyApprovalType(approvalType: string): boolean {
  const normalized = approvalType.toUpperCase();
  return !normalized.includes("FUND_TRANSFER") && !normalized.includes("RTGS");
}

export function transactionTypeForApprovalType(
  approvalType: string,
  transactionType: TransactionType,
): TransactionType {
  return isPerTransactionOnlyApprovalType(approvalType) ? "PER_TRANSACTION" : transactionType;
}

export function isValidEffectiveDate(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
