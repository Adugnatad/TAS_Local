import { NextResponse } from "next/server";
import { now, officers, requireCapability } from "@/app/api/_data/store";
import type { CreateOfficerInput } from "@/features/auth/types";
import { OFFICER_ROLES } from "@/lib/constants";

export async function GET() {
  const { error } = requireCapability("users.manage");
  if (error) return error;
  return NextResponse.json(
    [...officers].sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export async function POST(request: Request) {
  const { error } = requireCapability("users.manage");
  if (error) return error;

  const body = (await request.json()) as CreateOfficerInput;
  if (!body.name || !body.email || !body.role) {
    return NextResponse.json({ message: "Name, email, and role are required" }, { status: 400 });
  }
  if (!OFFICER_ROLES.includes(body.role)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }
  if (officers.some((item) => item.email.toLowerCase() === body.email.toLowerCase())) {
    return NextResponse.json({ message: "Email already exists" }, { status: 409 });
  }

  const timestamp = now();
  const officer = {
    id: `usr-${Date.now()}`,
    name: body.name.trim(),
    email: body.email.trim(),
    role: body.role,
    phone: body.phone?.trim() || undefined,
    department: body.department?.trim() || undefined,
    isActive: body.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  officers.push(officer);
  return NextResponse.json(officer, { status: 201 });
}
