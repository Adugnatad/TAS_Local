import { describe, expect, it } from "vitest";
import { evaluateMatrixPreview } from "@/features/signatory-matrix/utils/matrix-preview";
import type { Signatory, SignatoryRule } from "@/features/signatory-matrix/types";

const signatories: Signatory[] = [
  {
    id: "1",
    customerId: "c1",
    fullName: "Alice MD",
    role: "Managing Director",
    signatureLimit: 5000000,
    isActive: true,
  },
  {
    id: "2",
    customerId: "c1",
    fullName: "Bob CFO",
    role: "CFO",
    signatureLimit: 3000000,
    isActive: true,
  },
];

const rules: SignatoryRule[] = [
  { id: "r1", customerId: "c1", minSignatories: 1, amountThreshold: 0 },
  {
    id: "r2",
    customerId: "c1",
    minSignatories: 2,
    requiredRoles: ["Managing Director"],
    amountThreshold: 1000000,
  },
];

describe("evaluateMatrixPreview", () => {
  it("finds valid combinations for amounts within limits", () => {
    const result = evaluateMatrixPreview(500000, signatories, rules);
    expect(result.canApprove).toBe(true);
    expect(result.validCombinations.length).toBeGreaterThan(0);
  });

  it("returns no valid combinations when amount exceeds all limits", () => {
    const result = evaluateMatrixPreview(50000000, signatories, rules);
    expect(result.canApprove).toBe(false);
  });
});
