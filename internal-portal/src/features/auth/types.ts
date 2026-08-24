import type { OfficerRole } from "@/lib/constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: OfficerRole;
  phone?: string;
  department?: string;
}

export interface Officer extends SessionUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginInput {
  role: OfficerRole;
  name?: string;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
  phone?: string;
  department?: string;
}

export interface CreateOfficerInput {
  name: string;
  email: string;
  role: OfficerRole;
  phone?: string;
  department?: string;
  isActive?: boolean;
}

export type UpdateOfficerInput = Partial<CreateOfficerInput>;
