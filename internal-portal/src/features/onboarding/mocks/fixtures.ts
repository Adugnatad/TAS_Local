import type { CustomerProfile } from "../types";

const industries = [
  "Manufacturing",
  "Retail",
  "Agriculture",
  "Logistics",
  "Construction",
  "Healthcare",
  "Technology",
  "Food & Beverage",
];

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
    legalName: [
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
    registrationNumber: `REG-${2020 + (i % 5)}-${String(1000 + i)}`,
    industry: industries[i % industries.length],
    onboardingStatus: status,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(0, createdDaysAgo - (i % 5))),
  };
});

export function getCustomerById(id: string): CustomerProfile | undefined {
  return customersFixture.find((c) => c.id === id);
}
