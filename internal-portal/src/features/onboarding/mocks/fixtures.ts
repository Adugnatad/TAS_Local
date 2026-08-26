import type { CustomerProfile } from "../../../lib/types";

const statuses: CustomerProfile["onboardingStatus"][] = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export const customersFixture: CustomerProfile[] = Array.from({ length: 18 }, (_, i) => {
  const id = `cust-${String(i + 1).padStart(3, "0")}`;
  const status = statuses[i % statuses.length];
  const createdDaysAgo = 30 - i;
  return {
    id,
    name: [
      "Acme Manufacturing Corp.",
      "Bayanihan Retail Group",
      "Cebu Agri Ventures Inc.",
      "Delta Logistics Partners",
      "Eastern Construction Co.",
      "First Health Systems",
      "Golden Harvest Foods",
      "Highland Tech Solutions",
      "Island Trading House",
      "Jade Pacific Exports",
      "Kinetic Auto Parts",
      "Luzon Marine Services",
      "Metro Finance Holdings",
      "Northern Grain Mills",
      "Oceanic Shipping Lines",
      "Prime Realty Developers",
      "Quantum Energy Corp.",
      "Riverside Cooperative Bank Client",
    ][i],
    tin: `TIN-${String(100000 + i)}`,
    accounts: [{ accountNumber: `ACC-${String(1000 + i)}`, isPrimary: true }],
    address: `${i + 1} Corporate Avenue, Manila`,
    phone: `+63 917 555 ${String(1000 + i)}`,
    crmSystemId: `CRM-${String(i + 1).padStart(4, "0")}`,
    onboardingStatus: status,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(0, createdDaysAgo - (i % 5))),
  };
});

export function getCustomerById(id: string): CustomerProfile | undefined {
  return customersFixture.find((c) => c.id === id);
}
