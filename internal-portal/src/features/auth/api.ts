import { apiClient } from "@/lib/api-client";
import type { LoginInput, SessionUser } from "./types";

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
