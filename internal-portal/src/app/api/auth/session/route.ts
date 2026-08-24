import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SessionUser } from "@/features/auth/types";

export async function GET() {
  const value = cookies().get("tas-session")?.value;
  if (!value) return NextResponse.json(null);

  try {
    return NextResponse.json(JSON.parse(decodeURIComponent(value)) as SessionUser);
  } catch {
    return NextResponse.json(null);
  }
}
