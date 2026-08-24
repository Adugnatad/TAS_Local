import { NextResponse } from "next/server";
import { signatoryTitles } from "@/app/api/_data/store";
import type { SignatoryTitle } from "@/features/signatory-matrix/types";

type Context = { params: { titleId: string } };

export async function PUT(request: Request, { params }: Context) {
  const index = signatoryTitles.findIndex((item) => item.id === params.titleId);
  if (index === -1) {
    return NextResponse.json({ message: "Title not found" }, { status: 404 });
  }
  const body = (await request.json()) as Partial<SignatoryTitle>;
  signatoryTitles[index] = { ...signatoryTitles[index], ...body };
  return NextResponse.json(signatoryTitles[index]);
}
