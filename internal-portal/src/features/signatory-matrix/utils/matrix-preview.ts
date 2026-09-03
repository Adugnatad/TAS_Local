import type { MatrixPreviewResult, Signatory, SignatoryRule } from "../types";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  if (size === 1) return items.map((item) => [item]);

  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  return [...withFirst, ...combinations(rest, size)];
}

export function satisfiesRule(combo: Signatory[], rule: SignatoryRule): boolean {
  if (rule.dualControl && combo.length < 2) return false;
  if (combo.length < rule.minSignatories) return false;
  if (rule.maxSignatories && combo.length > rule.maxSignatories) return false;

  if (rule.requiredRoles?.length) {
    const comboRoles = new Set(combo.map((signatory) => signatory.role));
    const matches = rule.roleMatch ?? "all";
    const rolesMatch =
      matches === "any"
        ? rule.requiredRoles.some((role) => comboRoles.has(role))
        : rule.requiredRoles.every((role) => comboRoles.has(role));
    if (!rolesMatch) return false;
  }

  const totalLimit = combo.reduce((sum, signatory) => sum + signatory.signatureLimit, 0);
  return (
    totalLimit >= rule.amountThreshold ||
    combo.some((signatory) => signatory.signatureLimit >= rule.amountThreshold)
  );
}

export function evaluateMatrixPreview(
  amount: number,
  signatories: Signatory[],
  rules: SignatoryRule[],
): MatrixPreviewResult {
  const activeSignatories = signatories.filter((signatory) => signatory.isActive);
  const applicableRules = rules
    .filter((rule) => amount >= rule.amountThreshold)
    .sort((left, right) => right.amountThreshold - left.amountThreshold);

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
    ...applicableRules.map((rule) => rule.maxSignatories ?? 0),
    ...applicableRules.map((rule) => rule.minSignatories),
  );
  const maxSignatories = Math.min(activeSignatories.length, Math.min(requestedCap, 6));
  const allCombinations: Signatory[][] = [];
  for (let size = 1; size <= maxSignatories; size += 1) {
    allCombinations.push(...combinations(activeSignatories, size));
  }

  const validCombinations = allCombinations
    .map((combo) => {
      const totalLimit = combo.reduce((sum, signatory) => sum + signatory.signatureLimit, 0);
      const meetsAmount =
        totalLimit >= amount || combo.some((signatory) => signatory.signatureLimit >= amount);
      const meetsRules =
        applicableRules.length === 0 || applicableRules.every((rule) => satisfiesRule(combo, rule));
      const satisfies = meetsAmount && meetsRules;

      return {
        signatories: combo,
        satisfiesRules: satisfies,
        reason: !meetsAmount
          ? "Combined signature limit is below the requested amount."
          : !meetsRules
            ? "Does not satisfy one or more signatory rules."
            : undefined,
      };
    })
    .filter((combination) => combination.satisfiesRules)
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
