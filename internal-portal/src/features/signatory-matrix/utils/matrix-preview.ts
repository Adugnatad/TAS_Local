import type { Signatory, SignatoryRule, MatrixPreviewResult } from "../types";

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  if (k === 1) return items.map((item) => [item]);
  const [first, ...rest] = items;
  const withFirst = combinations(rest, k - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export function satisfiesRule(combo: Signatory[], rule: SignatoryRule): boolean {
  if (rule.dualControl && combo.length < 2) return false;
  if (combo.length < rule.minSignatories) return false;
  if (rule.maxSignatories && combo.length > rule.maxSignatories) return false;

  if (rule.requiredRoles?.length) {
    const comboRoles = new Set(combo.map((s) => s.role));
    const match = rule.roleMatch ?? "all";
    const ok =
      match === "any"
        ? rule.requiredRoles.some((role) => comboRoles.has(role))
        : rule.requiredRoles.every((role) => comboRoles.has(role));
    if (!ok) return false;
  }

  const totalLimit = combo.reduce((sum, s) => sum + s.signatureLimit, 0);
  return totalLimit >= rule.amountThreshold || combo.some((s) => s.signatureLimit >= rule.amountThreshold);
}

export function evaluateMatrixPreview(
  amount: number,
  signatories: Signatory[],
  rules: SignatoryRule[],
): MatrixPreviewResult {
  const activeSignatories = signatories.filter((s) => s.isActive);
  const applicableRules = rules
    .filter((r) => amount >= r.amountThreshold)
    .sort((a, b) => b.amountThreshold - a.amountThreshold);

  if (activeSignatories.length === 0) {
    return {
      amount,
      applicableRules,
      validCombinations: [],
      canApprove: false,
      summary: "No active signatories available for this customer.",
    };
  }

  const requestedCap = Math.max(
    4,
    ...applicableRules.map((r) => r.maxSignatories ?? 0),
    ...applicableRules.map((r) => r.minSignatories),
  );
  const maxSignatories = Math.min(activeSignatories.length, Math.min(requestedCap, 6));
  const allCombos: Signatory[][] = [];
  for (let k = 1; k <= maxSignatories; k++) {
    allCombos.push(...combinations(activeSignatories, k));
  }

  const validCombinations = allCombos
    .map((combo) => {
      const totalLimit = combo.reduce((sum, s) => sum + s.signatureLimit, 0);
      const meetsAmount = totalLimit >= amount || combo.some((s) => s.signatureLimit >= amount);
      const satisfiesRules =
        applicableRules.length === 0 ||
        applicableRules.every((rule) => satisfiesRule(combo, rule));

      const satisfies = meetsAmount && satisfiesRules;
      let reason: string | undefined;
      if (!meetsAmount) {
        reason = "Combined signature limit is below the requested amount.";
      } else if (!satisfiesRules) {
        reason = "Does not satisfy one or more signatory rules.";
      }

      return {
        signatories: combo,
        satisfiesRules: satisfies,
        reason,
      };
    })
    .filter((c) => c.satisfiesRules)
    .slice(0, 5);

  const canApprove = validCombinations.length > 0;

  return {
    amount,
    applicableRules,
    validCombinations,
    canApprove,
    summary: canApprove
      ? `Found ${validCombinations.length} valid signatory combination(s) for ${amount.toLocaleString()}.`
      : "No valid signatory combinations satisfy the rules for this amount.",
  };
}
