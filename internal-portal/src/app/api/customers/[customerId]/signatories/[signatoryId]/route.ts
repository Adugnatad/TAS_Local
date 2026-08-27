import { NextResponse } from "next/server";
import { signatories } from "@/app/api/_data/store";
import type { Signatory } from "@/features/signatory-matrix/types";

type Context = { params: { customerId: string; signatoryId: string } };

export async function PUT(request: Request, { params }: Context) {
  const index = signatories.findIndex(
    (item) => item.id === params.signatoryId && item.customerId === params.customerId,
  );
  if (index === -1) return NextResponse.json({ message: "Signatory not found" }, { status: 404 });
  signatories[index] = { ...signatories[index], ...((await request.json()) as Partial<Signatory>) };
  return NextResponse.json(signatories[index]);
}
