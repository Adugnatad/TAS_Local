import { NextResponse } from "next/server";
import { signatories, signatoryRules } from "@/app/api/_data/store";
import { evaluateMatrixPreview } from "@/features/signatory-matrix/utils/matrix-preview";

type Context = { params: { customerId: string } };

export async function POST(request: Request, { params }: Context) {
  const body = (await request.json()) as { amount: number };
  return NextResponse.json(
    evaluateMatrixPreview(
      body.amount,
      signatories.filter((item) => item.customerId === params.customerId),
      signatoryRules
        .filter((item) => item.customerId === params.customerId)
        .map((rule) => ({
          ...rule,
          roleMatch: rule.roleMatch ?? "all",
          dualControl: rule.dualControl ?? false,
        })),
    ),
  );
}
