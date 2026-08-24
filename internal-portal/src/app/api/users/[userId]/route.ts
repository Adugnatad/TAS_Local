import { NextResponse } from "next/server";
import {
  activeAdminCount,
  now,
  officers,
  requireCapability,
} from "@/app/api/_data/store";
import type { UpdateOfficerInput } from "@/features/auth/types";
import { OFFICER_ROLES } from "@/lib/constants";

type Context = { params: { userId: string } };

export async function PUT(request: Request, { params }: Context) {
  const { session, error } = requireCapability("users.manage");
  if (error) return error;

  const index = officers.findIndex((item) => item.id === params.userId);
  if (index === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdateOfficerInput;
  const current = officers[index];

  if (body.role && !OFFICER_ROLES.includes(body.role)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }
  if (
    body.email &&
    officers.some(
      (item) => item.id !== params.userId && item.email.toLowerCase() === body.email!.toLowerCase(),
    )
  ) {
    return NextResponse.json({ message: "Email already exists" }, { status: 409 });
  }

  const nextRole = body.role ?? current.role;
  const nextActive = body.isActive ?? current.isActive;
  const removingLastAdmin =
    current.role === "admin" &&
    current.isActive &&
    (nextRole !== "admin" || nextActive === false) &&
    activeAdminCount(current.id) === 0;

  if (removingLastAdmin) {
    return NextResponse.json(
      { message: "At least one active administrator is required." },
      { status: 409 },
    );
  }

  if (session?.id === current.id && body.isActive === false) {
    return NextResponse.json({ message: "You cannot deactivate your own account." }, { status: 409 });
  }

  officers[index] = {
    ...current,
    ...body,
    name: body.name?.trim() ?? current.name,
    email: body.email?.trim() ?? current.email,
    phone: body.phone === undefined ? current.phone : body.phone.trim() || undefined,
    department:
      body.department === undefined ? current.department : body.department.trim() || undefined,
    updatedAt: now(),
  };
  return NextResponse.json(officers[index]);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { session, error } = requireCapability("users.manage");
  if (error) return error;

  const index = officers.findIndex((item) => item.id === params.userId);
  if (index === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const current = officers[index];
  if (session?.id === current.id) {
    return NextResponse.json({ message: "You cannot delete your own account." }, { status: 409 });
  }
  if (current.role === "admin" && current.isActive && activeAdminCount(current.id) === 0) {
    return NextResponse.json(
      { message: "At least one active administrator is required." },
      { status: 409 },
    );
  }

  officers.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
