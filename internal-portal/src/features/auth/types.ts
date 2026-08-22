import type { OfficerRole } from "@/lib/constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: OfficerRole;
}

export interface LoginInput {
  role: OfficerRole;
  name?: string;
}
