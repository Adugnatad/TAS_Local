import { describe, expect, it } from "vitest";
import {
  evaluateMatrixPreview,
  satisfiesRule,
} from "@/features/signatory-matrix/utils/matrix-preview";
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
  {
    id: "r1",
    customerId: "c1",
    minSignatories: 1,
    amountThreshold: 0,
    roleMatch: "all",
    dualControl: false,
  },
  {
    id: "r2",
    customerId: "c1",
    minSignatories: 2,
    requiredRoles: ["Managing Director"],
    amountThreshold: 1000000,
    roleMatch: "all",
    dualControl: false,
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

describe("satisfiesRule", () => {
  const combo = signatories;

  it("accepts any-of required roles", () => {
    const rule: SignatoryRule = {
      id: "any",
      customerId: "c1",
      minSignatories: 1,
      amountThreshold: 0,
      requiredRoles: ["CFO", "Treasurer"],
      roleMatch: "any",
      dualControl: false,
    };
    expect(satisfiesRule([signatories[1]], rule)).toBe(true);
    expect(satisfiesRule([signatories[0]], rule)).toBe(false);
  });

  it("enforces max signatories", () => {
    const rule: SignatoryRule = {
      id: "max",
      customerId: "c1",
      minSignatories: 1,
      maxSignatories: 1,
      amountThreshold: 0,
      roleMatch: "all",
      dualControl: false,
    };
    expect(satisfiesRule([signatories[0]], rule)).toBe(true);
    expect(satisfiesRule(combo, rule)).toBe(false);
  });

  it("requires two people for dual control", () => {
    const rule: SignatoryRule = {
      id: "dual",
      customerId: "c1",
      minSignatories: 1,
      amountThreshold: 0,
      roleMatch: "all",
      dualControl: true,
    };
    expect(satisfiesRule([signatories[0]], rule)).toBe(false);
    expect(satisfiesRule(combo, rule)).toBe(true);
  });
});
