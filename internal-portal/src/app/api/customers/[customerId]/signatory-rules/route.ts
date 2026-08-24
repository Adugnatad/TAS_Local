import { NextResponse } from "next/server";
import { signatoryRules } from "@/app/api/_data/store";
import type { SignatoryRule } from "@/features/signatory-matrix/types";

type Context = { params: { customerId: string } };

function withDefaults(rule: SignatoryRule): SignatoryRule {
  return {
    ...rule,
    roleMatch: rule.roleMatch ?? "all",
    dualControl: rule.dualControl ?? false,
  };
}

export async function GET(_: Request, { params }: Context) {
  return NextResponse.json(
    signatoryRules.filter((item) => item.customerId === params.customerId).map(withDefaults),
  );
}

export async function POST(request: Request, { params }: Context) {
  const body = (await request.json()) as Omit<SignatoryRule, "id" | "customerId">;
  const rule: SignatoryRule = withDefaults({
    id: `rule-${params.customerId}-${Date.now()}`,
    customerId: params.customerId,
    ...body,
  });
  signatoryRules.push(rule);
  return NextResponse.json(rule, { status: 201 });
}
