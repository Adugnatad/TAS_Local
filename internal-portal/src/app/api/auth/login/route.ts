import { NextResponse } from "next/server";
import type { OfficerRole } from "@/lib/constants";
import { officers, setSessionCookie, toSessionUser } from "@/app/api/_data/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { role?: OfficerRole; name?: string };
  if (!body.role) {
    return NextResponse.json({ message: "Invalid officer role" }, { status: 400 });
  }

  const officer = officers.find((item) => item.role === body.role && item.isActive);
  if (!officer) {
    return NextResponse.json({ message: "No active officer found for that role" }, { status: 400 });
  }

  officer.lastLoginAt = new Date().toISOString();
  officer.updatedAt = officer.lastLoginAt;

  const user = {
    ...toSessionUser(officer),
    ...(body.name ? { name: body.name } : {}),
  };
  const response = NextResponse.json(user);
  setSessionCookie(response, user);
  return response;
}
