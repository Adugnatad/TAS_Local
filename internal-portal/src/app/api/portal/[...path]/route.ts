import { proxyToPortalCore } from "@/app/api/_lib/portal";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  return proxyToPortalCore(request, path.join("/"));
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
