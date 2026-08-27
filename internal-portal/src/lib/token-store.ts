let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let onTokensUpdated: ((access: string, refresh: string) => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(access: string | null, refresh: string | null): void {
  accessToken = access;
  refreshToken = refresh;
  if (access && refresh) {
    onTokensUpdated?.(access, refresh);
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function setOnTokensUpdated(
  handler: ((access: string, refresh: string) => void) | null,
): void {
  onTokensUpdated = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}
