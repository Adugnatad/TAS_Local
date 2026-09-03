import { customersFixture } from "@/features/onboarding/mocks/fixtures";
import type { CustomerProfile } from "@/lib/types";
import {
  officersFixture,
  rolePermissionsFixture,
  signatoriesFixture,
  signatoryRulesFixture,
  signatoryTitlesFixture,
} from "@/features/signatory-matrix/mocks/fixtures";
import type { Signatory, SignatoryRule, SignatoryTitle } from "@/features/signatory-matrix/types";
import { requestsFixture } from "@/features/status-viewer/mocks/fixtures";
import type { RequestStatusSummary } from "@/features/status-viewer/types";
import type { Officer, SessionUser } from "@/features/auth/types";
import type { Capability, OfficerRole } from "@/lib/constants";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const customers: CustomerProfile[] = [...customersFixture];
export const signatories: Signatory[] = [...signatoriesFixture];
export const signatoryRules: SignatoryRule[] = [...signatoryRulesFixture];
export const signatoryTitles: SignatoryTitle[] = [...signatoryTitlesFixture];
export const requests: RequestStatusSummary[] = [...requestsFixture];
export const officers: Officer[] = [...officersFixture];
export const rolePermissions: Record<OfficerRole, Capability[]> = {
  officer: [...rolePermissionsFixture.officer],
  supervisor: [...rolePermissionsFixture.supervisor],
  admin: [...rolePermissionsFixture.admin],
};

export function now(): string {
  return new Date().toISOString();
}

export function toSessionUser(officer: Officer): SessionUser {
  return {
    id: officer.id,
    username: officer.email,
    email: officer.email,
    firstName: officer.name,
    lastName: null,
    userType: "EMPLOYEE",
    roles: [officer.role],
    permissions: rolePermissions[officer.role],
    organization: null,
    permissionType: null,
  };
}

export function readSession(): SessionUser | null {
  const value = cookies().get("tas-session")?.value;
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as SessionUser;
  } catch {
    return null;
  }
}

export function requireCapability(capability: Capability) {
  const session = readSession();
  if (!session) {
    return {
      session: null as SessionUser | null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  const granted = session.permissions ?? [];
  if (!granted.includes(capability)) {
    return {
      session,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

export function activeAdminCount(excludingId?: string) {
  return officers.filter(
    (item) => item.role === "admin" && item.isActive && item.id !== excludingId,
  ).length;
}

export function setSessionCookie(
  response: { cookies: { set: (name: string, value: string, options: object) => void } },
  user: SessionUser,
) {
  response.cookies.set("tas-session", encodeURIComponent(JSON.stringify(user)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
