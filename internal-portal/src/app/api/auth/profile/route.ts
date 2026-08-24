import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SessionUser } from "@/features/auth/types";
import { officers, setSessionCookie, toSessionUser } from "@/app/api/_data/store";

function readSession(): SessionUser | null {
  const value = cookies().get("tas-session")?.value;
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as SessionUser;
  } catch {
    return null;
  }
}

export async function PATCH(request: Request) {
  const session = readSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
  };

  const index = officers.findIndex((item) => item.id === session.id);
  if (index === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  officers[index] = {
    ...officers[index],
    name: body.name ?? officers[index].name,
    email: body.email ?? officers[index].email,
    phone: body.phone,
    department: body.department,
    updatedAt: new Date().toISOString(),
  };

  const user = toSessionUser(officers[index]);
  const response = NextResponse.json(user);
  setSessionCookie(response, user);
  return response;
}
