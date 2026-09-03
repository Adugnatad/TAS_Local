import type { Signatory, SignatoryRule, SignatoryTitle } from "../types";
import { customersFixture } from "@/features/onboarding/mocks/fixtures";
import type { Officer } from "@/features/auth/types";
import type { Capability, OfficerRole } from "@/lib/constants";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/constants";

const roles = ["Managing Director", "CFO", "Treasurer", "Board Secretary", "Authorized Signatory"];

export const signatoryTitlesFixture: SignatoryTitle[] = roles.map((name, index) => ({
  id: `title-${index + 1}`,
  name,
  isActive: true,
}));

export const signatoriesFixture: Signatory[] = customersFixture.flatMap(
  (customer, customerIndex) => {
    const count = 3 + (customerIndex % 3);
    return Array.from({ length: count }, (_, index) => ({
      id: `sig-${customer.id}-${index + 1}`,
      customerId: customer.id,
      fullName: [
        "Roberto Garcia",
        "Elena Mendoza",
        "Carlos Navarro",
        "Patricia Lim",
        "Miguel Torres",
      ][index % 5],
      role: roles[index % roles.length],
      signatureLimit: [500000, 1000000, 2500000, 5000000, 10000000][index % 5],
      isActive: index !== count - 1 || customerIndex % 4 !== 0,
    }));
  },
);

export const signatoryRulesFixture: SignatoryRule[] = customersFixture.flatMap(
  (customer, customerIndex) => {
    const rulesForCustomer: SignatoryRule[] = [
      {
        id: `rule-${customer.id}-1`,
        customerId: customer.id,
        minSignatories: 1,
        amountThreshold: 0,
        roleMatch: "all",
        dualControl: false,
      },
      {
        id: `rule-${customer.id}-2`,
        customerId: customer.id,
        minSignatories: 2,
        requiredRoles: customerIndex % 2 === 0 ? ["Managing Director"] : undefined,
        amountThreshold: 1000000,
        roleMatch: "all",
        dualControl: true,
      },
    ];
    if (customerIndex % 3 === 0) {
      rulesForCustomer.push({
        id: `rule-${customer.id}-3`,
        customerId: customer.id,
        minSignatories: 3,
        maxSignatories: 4,
        requiredRoles: ["Managing Director", "CFO"],
        amountThreshold: 5000000,
        roleMatch: "any",
        dualControl: true,
      });
    }
    return rulesForCustomer;
  },
);

export const officersFixture: Officer[] = [
  {
    id: "usr-officer-1",
    name: "Maria Santos",
    email: "maria.santos@coopbank.local",
    role: "officer",
    phone: "+63 917 555 0101",
    department: "Corporate Onboarding",
    isActive: true,
    createdAt: "2025-11-04T08:00:00.000Z",
    updatedAt: "2026-08-12T09:15:00.000Z",
    lastLoginAt: "2026-08-24T07:02:00.000Z",
  },
  {
    id: "usr-officer-2",
    name: "Luis Ramirez",
    email: "luis.ramirez@coopbank.local",
    role: "officer",
    phone: "+63 917 555 0104",
    department: "Trade Services",
    isActive: true,
    createdAt: "2026-01-18T08:00:00.000Z",
    updatedAt: "2026-07-30T11:40:00.000Z",
    lastLoginAt: "2026-08-21T04:20:00.000Z",
  },
  {
    id: "usr-supervisor-1",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@coopbank.local",
    role: "supervisor",
    phone: "+63 917 555 0102",
    department: "Credit Operations",
    isActive: true,
    createdAt: "2025-09-12T08:00:00.000Z",
    updatedAt: "2026-08-10T14:05:00.000Z",
    lastLoginAt: "2026-08-23T10:11:00.000Z",
  },
  {
    id: "usr-admin-1",
    name: "Ana Reyes",
    email: "ana.reyes@coopbank.local",
    role: "admin",
    phone: "+63 917 555 0103",
    department: "Internal Controls",
    isActive: true,
    createdAt: "2025-06-01T08:00:00.000Z",
    updatedAt: "2026-08-20T16:00:00.000Z",
    lastLoginAt: "2026-08-24T06:45:00.000Z",
  },
  {
    id: "usr-officer-3",
    name: "Sofia Cruz",
    email: "sofia.cruz@coopbank.local",
    role: "officer",
    phone: "+63 917 555 0105",
    department: "Corporate Onboarding",
    isActive: false,
    createdAt: "2026-03-09T08:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
    lastLoginAt: "2026-07-28T03:12:00.000Z",
  },
];

export const rolePermissionsFixture: Record<OfficerRole, Capability[]> = {
  officer: [...DEFAULT_ROLE_PERMISSIONS.officer],
  supervisor: [...DEFAULT_ROLE_PERMISSIONS.supervisor],
  admin: [...DEFAULT_ROLE_PERMISSIONS.admin],
};

export function getSignatoriesByCustomer(customerId: string): Signatory[] {
  return signatoriesFixture.filter((signatory) => signatory.customerId === customerId);
}

export function getRulesByCustomer(customerId: string): SignatoryRule[] {
  return signatoryRulesFixture.filter((rule) => rule.customerId === customerId);
}
