import type { Signatory, SignatoryRule } from "../types";
import { customersFixture } from "@/features/onboarding/mocks/fixtures";

const roles = [
  "Managing Director",
  "CFO",
  "Treasurer",
  "Board Secretary",
  "Authorized Signatory",
];

export const signatoriesFixture: Signatory[] = customersFixture.flatMap((customer, ci) => {
  const count = 3 + (ci % 3);
  return Array.from({ length: count }, (_, i) => ({
    id: `sig-${customer.id}-${i + 1}`,
    customerId: customer.id,
    fullName: [
      "Roberto Garcia",
      "Elena Mendoza",
      "Carlos Navarro",
      "Patricia Lim",
      "Miguel Torres",
    ][i % 5],
    role: roles[i % roles.length],
    signatureLimit: [500000, 1000000, 2500000, 5000000, 10000000][i % 5],
    isActive: i !== count - 1 || ci % 4 !== 0,
  }));
});

export const signatoryRulesFixture: SignatoryRule[] = customersFixture.flatMap((customer, ci) => {
  const rules: SignatoryRule[] = [
    {
      id: `rule-${customer.id}-1`,
      customerId: customer.id,
      minSignatories: 1,
      amountThreshold: 0,
    },
    {
      id: `rule-${customer.id}-2`,
      customerId: customer.id,
      minSignatories: 2,
      requiredRoles: ci % 2 === 0 ? ["Managing Director"] : undefined,
      amountThreshold: 1000000,
    },
  ];
  if (ci % 3 === 0) {
    rules.push({
      id: `rule-${customer.id}-3`,
      customerId: customer.id,
      minSignatories: 3,
      requiredRoles: ["Managing Director", "CFO"],
      amountThreshold: 5000000,
    });
  }
  return rules;
});

export function getSignatoriesByCustomer(customerId: string): Signatory[] {
  return signatoriesFixture.filter((s) => s.customerId === customerId);
}

export function getRulesByCustomer(customerId: string): SignatoryRule[] {
  return signatoryRulesFixture.filter((r) => r.customerId === customerId);
}
