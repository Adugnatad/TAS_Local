import { NextResponse } from "next/server";
import type { OfficerRole } from "@/lib/constants";
import type { SessionUser } from "@/features/auth/types";

const users: Record<OfficerRole, SessionUser> = {
  officer: {
    id: "usr-officer-1",
    name: "Maria Santos",
    email: "maria.santos@coopbank.local",
    role: "officer",
  },
  supervisor: {
    id: "usr-supervisor-1",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@coopbank.local",
    role: "supervisor",
  },
  admin: { id: "usr-admin-1", name: "Ana Reyes", email: "ana.reyes@coopbank.local", role: "admin" },
};

export async function POST(request: Request) {
  const body = (await request.json()) as { role?: OfficerRole; name?: string };
  if (!body.role || !users[body.role]) {
    return NextResponse.json({ message: "Invalid officer role" }, { status: 400 });
  }

  const user = { ...users[body.role], ...(body.name ? { name: body.name } : {}) };
  const response = NextResponse.json(user);
  response.cookies.set("tas-session", encodeURIComponent(JSON.stringify(user)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
