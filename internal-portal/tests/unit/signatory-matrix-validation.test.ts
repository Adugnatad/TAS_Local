import { describe, expect, it } from "vitest";
import {
  isPerTransactionOnlyApprovalType,
  isValidEffectiveDate,
  normalizeApprovalActions,
  normalizeApprovalActionOptions,
  normalizeApprovalRule,
  normalizeMatrixEvaluation,
  transactionTypeForApprovalType,
} from "@/features/signatory-matrix/validation";

describe("signatory matrix API compatibility", () => {
  it("normalizes string action options without collapsing checkbox identities", () => {
    expect(normalizeApprovalActionOptions(["CREATE", "UPDATE", "CANCEL"])).toEqual([
      { value: "CREATE", label: "CREATE" },
      { value: "UPDATE", label: "UPDATE" },
      { value: "CANCEL", label: "CANCEL" },
    ]);
  });

  it("prefers approvalActions and falls back to legacy approvalAction", () => {
    expect(
      normalizeApprovalActions({ approvalActions: ["CREATE", "UPDATE"], approvalAction: "CANCEL" }),
    ).toEqual(["CREATE", "UPDATE"]);
    expect(normalizeApprovalActions({ approvalAction: "CREATE" })).toEqual(["CREATE"]);
  });

  it("normalizes legacy rule and evaluation responses with the first action", () => {
    expect(
      normalizeApprovalRule({
        id: "rule-1",
        approvalType: "LOAN_APPLICATION",
        approvalAction: "CREATE",
      } as never),
    ).toMatchObject({
      approvalActions: ["CREATE"],
      approvalAction: "CREATE",
    });
    expect(normalizeMatrixEvaluation({ approvalAction: "UPDATE" })).toMatchObject({
      approvalActions: ["UPDATE"],
      approvalAction: "UPDATE",
    });
  });
});

describe("signatory matrix validation", () => {
  it("accepts valid ISO dates and rejects malformed or impossible dates", () => {
    expect(isValidEffectiveDate(null)).toBe(true);
    expect(isValidEffectiveDate("2026-09-03")).toBe(true);
    expect(isValidEffectiveDate("2026-9-3")).toBe(false);
    expect(isValidEffectiveDate("2026-02-30")).toBe(false);
  });

  it("restricts loan and trade approval types to per-transaction mode", () => {
    expect(isPerTransactionOnlyApprovalType("LOAN_APPLICATION")).toBe(true);
    expect(isPerTransactionOnlyApprovalType("TRADE_SETTLEMENT")).toBe(true);
    expect(isPerTransactionOnlyApprovalType("FUND_TRANSFER")).toBe(false);
    expect(isPerTransactionOnlyApprovalType("RTGS_TRANSFER")).toBe(false);
    expect(isPerTransactionOnlyApprovalType("CUSTOM_APPROVAL")).toBe(true);
    expect(transactionTypeForApprovalType("LOAN_APPLICATION", "AGGREGATE_DAILY")).toBe(
      "PER_TRANSACTION",
    );
    expect(transactionTypeForApprovalType("FUND_TRANSFER", "AGGREGATE_MONTHLY")).toBe(
      "AGGREGATE_MONTHLY",
    );
  });
});
