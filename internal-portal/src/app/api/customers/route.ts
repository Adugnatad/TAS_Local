import { NextResponse } from "next/server";
import type { CustomerProfile } from "@/features/onboarding/types";
import { customers, now } from "@/app/api/_data/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const filtered = customers
    .filter(
      (customer) =>
        !search ||
        [customer.legalName, customer.registrationNumber, customer.industry].some((value) =>
          value.toLowerCase().includes(search),
        ),
    )
    .filter((customer) => !status || customer.onboardingStatus === status)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({
    data: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<
    CustomerProfile,
    "id" | "createdAt" | "updatedAt" | "onboardingStatus"
  >;
  const timestamp = now();
  const customer: CustomerProfile = {
    id: `cust-${String(customers.length + 1).padStart(3, "0")}`,
    ...body,
    onboardingStatus: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  customers.unshift(customer);
  return NextResponse.json(customer, { status: 201 });
}
