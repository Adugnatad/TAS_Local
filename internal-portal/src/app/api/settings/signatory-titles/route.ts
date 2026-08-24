import { NextResponse } from "next/server";
import { signatoryTitles } from "@/app/api/_data/store";
import type { SignatoryTitle } from "@/features/signatory-matrix/types";

export async function GET() {
  return NextResponse.json(signatoryTitles);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; isActive?: boolean };
  if (!body.name?.trim()) {
    return NextResponse.json({ message: "Title name is required" }, { status: 400 });
  }

  const title: SignatoryTitle = {
    id: `title-${Date.now()}`,
    name: body.name.trim(),
    isActive: body.isActive ?? true,
  };
  signatoryTitles.push(title);
  return NextResponse.json(title, { status: 201 });
}
