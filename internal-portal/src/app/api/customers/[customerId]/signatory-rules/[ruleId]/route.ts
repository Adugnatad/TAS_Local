import { NextResponse } from "next/server";
import { signatoryRules } from "@/app/api/_data/store";
import type { SignatoryRule } from "@/features/signatory-matrix/types";

type Context = { params: { customerId: string; ruleId: string } };

function findRule(params: Context["params"]): number {
  return signatoryRules.findIndex(
    (item) => item.id === params.ruleId && item.customerId === params.customerId,
  );
}

export async function PUT(request: Request, { params }: Context) {
  const index = findRule(params);
  if (index === -1) return NextResponse.json({ message: "Rule not found" }, { status: 404 });
  signatoryRules[index] = {
    ...signatoryRules[index],
    ...((await request.json()) as Partial<SignatoryRule>),
  };
  return NextResponse.json(signatoryRules[index]);
}

export async function DELETE(_: Request, { params }: Context) {
  const index = findRule(params);
  if (index === -1) return NextResponse.json({ message: "Rule not found" }, { status: 404 });
  signatoryRules.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
