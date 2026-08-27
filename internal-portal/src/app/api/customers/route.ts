import { NextResponse, NextRequest } from "next/server";
import type { CustomerProfile } from "@/lib/types";
import { customers, now } from "@/app/api/_data/store";
import { createCustomer } from "@/lib/apis/customer_apis";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const filtered = customers
    .filter(
      (customer) =>
        !search ||
        [customer.name, customer.tin ?? "", customer.phone, customer.crmSystemId ?? ""].some(
          (value) => value.toLowerCase().includes(search),
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

export async function POST(request: NextRequest) {
  const body = JSON.parse((await request.json()) as string);
  const timestamp = now();
  const customer: CustomerProfile = {
    id: `cust-${String(customers.length + 1).padStart(3, "0")}`,
    ...body,
    onboardingStatus: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  try {
    const newCustomer = await createCustomer(customer);
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create customer" },
      { status: 400 },
    );
  }
}
