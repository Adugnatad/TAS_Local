import { NextResponse } from "next/server";
import { rolePermissions } from "@/app/api/_data/store";
import type { Capability, OfficerRole } from "@/lib/constants";
import { OFFICER_ROLES } from "@/lib/constants";

export async function GET() {
  return NextResponse.json(rolePermissions);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<Record<OfficerRole, Capability[]>>;
  for (const role of OFFICER_ROLES) {
    if (body[role]) {
      rolePermissions[role] = [...body[role]!];
    }
  }
  return NextResponse.json(rolePermissions);
}
