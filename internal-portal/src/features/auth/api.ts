import { apiClient } from "@/lib/api-client";
import type { TokenResponse } from "@/types/global";
import type { ChangePasswordInput, LoginInput, SessionUser } from "./types";

export async function login(input: LoginInput): Promise<TokenResponse> {
  return apiClient<TokenResponse>("/auth/login", {
    method: "POST",
    body: input,
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return apiClient<TokenResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function getMe(): Promise<SessionUser> {
  return apiClient<SessionUser>("/auth/me");
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiClient<void>("/auth/change-password", { method: "POST", body: input });
}
