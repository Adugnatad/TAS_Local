import { NextResponse } from "next/server";
import { customers, now } from "@/app/api/_data/store";
import type { CustomerProfile } from "@/features/onboarding/types";

type Context = { params: { customerId: string } };

export async function GET(_: Request, { params }: Context) {
  const customer = customers.find((item) => item.id === params.customerId);
  return customer
    ? NextResponse.json(customer)
    : NextResponse.json({ message: "Customer not found" }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  const index = customers.findIndex((item) => item.id === params.customerId);
  if (index === -1) return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  customers[index] = {
    ...customers[index],
    ...((await request.json()) as Partial<CustomerProfile>),
    updatedAt: now(),
  };
  return NextResponse.json(customers[index]);
}
