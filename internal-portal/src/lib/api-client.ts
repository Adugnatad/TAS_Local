import { API_BASE_URL } from "./constants";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifyUnauthorized,
  setTokens,
} from "./token-store";
import type { FieldError, TokenResponse } from "@/types/global";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public fieldErrors?: FieldError[],
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}`;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_BASE_URL}${path}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let code: string | undefined;
  let fieldErrors: FieldError[] | undefined;
  let details: unknown;
  try {
    const errorBody = await response.json();
    details = errorBody;
    message = errorBody.message ?? message;
    code = errorBody.code;
    fieldErrors = errorBody.fieldErrors;
  } catch {
    // ignore parse errors
  }
  return new ApiError(response.status, message, code, fieldErrors, details);
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const response = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": newRequestId(),
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as TokenResponse;
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function isAuthPath(path: string): boolean {
  return path === "/auth/login" || path === "/auth/refresh";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, skipAuth, skipRefresh, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    "X-Request-Id": newRequestId(),
  };
  if (!isFormData && body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }
  if (!skipAuth && !isAuthPath(path)) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }
  Object.assign(requestHeaders, headers);

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (
    response.status === 401 &&
    !skipRefresh &&
    !isAuthPath(path) &&
    !skipAuth
  ) {
    const error = await parseError(response.clone());
    const shouldRefresh = error.code === "INVALID_TOKEN" || !error.code;
    if (shouldRefresh) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiClient<T>(path, { ...options, skipRefresh: true });
      }
      clearTokens();
      notifyUnauthorized();
    }
    throw error;
  }

  return handleResponse<T>(response);
}

export async function apiDownload(
  path: string,
  options: Omit<RequestOptions, "body"> = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const { params, headers, skipAuth, skipRefresh, ...rest } = options;
  const requestHeaders: Record<string, string> = {
    "X-Request-Id": newRequestId(),
  };
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
  }
  Object.assign(requestHeaders, headers);

  const response = await fetch(buildUrl(path, params), { ...rest, headers: requestHeaders });
  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiDownload(path, { ...options, skipRefresh: true });
    }
    clearTokens();
    notifyUnauthorized();
    throw await parseError(response);
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return { blob: await response.blob(), filename: match?.[1] ?? null };
}
