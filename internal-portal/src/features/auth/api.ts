import { apiClient } from "@/lib/api-client";
import type {
  CreateOfficerInput,
  LoginInput,
  Officer,
  SessionUser,
  UpdateOfficerInput,
  UpdateProfileInput,
} from "./types";

export async function login(input: LoginInput): Promise<SessionUser> {
  return apiClient<SessionUser>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  return apiClient<SessionUser | null>("/auth/session");
}

export async function logout(): Promise<void> {
  return apiClient<void>("/auth/logout", { method: "POST" });
}

export async function updateProfile(input: UpdateProfileInput): Promise<SessionUser> {
  return apiClient<SessionUser>("/auth/profile", {
    method: "PATCH",
    body: input,
  });
}

export async function fetchOfficers(): Promise<Officer[]> {
  return apiClient<Officer[]>("/users");
}

export async function createOfficer(input: CreateOfficerInput): Promise<Officer> {
  return apiClient<Officer>("/users", { method: "POST", body: input });
}

export async function updateOfficer(userId: string, input: UpdateOfficerInput): Promise<Officer> {
  return apiClient<Officer>(`/users/${userId}`, { method: "PUT", body: input });
}

export async function deleteOfficer(userId: string): Promise<void> {
  return apiClient<void>(`/users/${userId}`, { method: "DELETE" });
}
