import { NextResponse } from "next/server";
import { signatories } from "@/app/api/_data/store";
import type { Signatory } from "@/features/signatory-matrix/types";

type Context = { params: { customerId: string } };

export async function GET(_: Request, { params }: Context) {
  return NextResponse.json(signatories.filter((item) => item.customerId === params.customerId));
}

export async function POST(request: Request, { params }: Context) {
  const body = (await request.json()) as Omit<Signatory, "id" | "customerId">;
  const signatory: Signatory = {
    id: `sig-${params.customerId}-${Date.now()}`,
    customerId: params.customerId,
    ...body,
    isActive: body.isActive ?? true,
  };
  signatories.push(signatory);
  return NextResponse.json(signatory, { status: 201 });
}
