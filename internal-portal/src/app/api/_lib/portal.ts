import { NextResponse } from "next/server";

const API_UPSTREAM_URL = process.env.API_UPSTREAM_URL ?? "http://10.12.53.67:8080/api/v1";

const FORWARD_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "x-request-id",
] as const;

const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "cache-control",
  "x-request-id",
] as const;

/**
 * Forward a Next.js Route Handler request to the server-only API upstream.
 */
export async function proxyToPortalCore(request: Request, path: string): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const targetPath = path.replace(/^\/+/, "");
  const targetUrl = new URL(`${API_UPSTREAM_URL.replace(/\/$/, "")}/${targetPath}`);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const responseHeaders = new Headers();
    for (const name of FORWARD_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach Portal Core";
    return NextResponse.json({ message, code: "PORTAL_CORE_UNAVAILABLE" }, { status: 502 });
  }
}

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Build thin Route Handlers that proxy to a fixed or param-derived Portal Core path.
 */
export function portalHandlers(
  resolvePath: (params: Record<string, string>) => string,
  methods: Array<"GET" | "POST" | "PUT" | "PATCH" | "DELETE"> = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ],
) {
  const handler = async (request: Request, context: RouteContext) => {
    const params = context?.params ? await context.params : {};
    return proxyToPortalCore(request, resolvePath(params));
  };

  const exports: Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", typeof handler>> = {};
  for (const method of methods) {
    exports[method] = handler;
  }
  return exports;
}
