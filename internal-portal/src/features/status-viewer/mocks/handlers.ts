import { http, HttpResponse } from "msw";
import { randomDelay } from "@/lib/utils";
import type { PaginatedResponse } from "@/types/global";
import type { RequestStatusSummary } from "../types";
import { getRequestDetail, requestsFixture } from "./fixtures";

export const statusViewerHandlers = [
  http.get("/api/requests", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const type = url.searchParams.get("type") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const customerId = url.searchParams.get("customerId") ?? "";
    const sortBy = url.searchParams.get("sortBy") ?? "lastUpdatedAt";
    const sortOrder = url.searchParams.get("sortOrder") ?? "desc";

    let filtered = [...requestsFixture];

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.customerName.toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search) ||
          r.currentStage.toLowerCase().includes(search),
      );
    }
    if (type) filtered = filtered.filter((r) => r.type === type);
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (customerId) filtered = filtered.filter((r) => r.customerId === customerId);

    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof RequestStatusSummary];
      const bVal = b[sortBy as keyof RequestStatusSummary];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? new Date(aVal).getTime() - new Date(bVal).getTime()
          : new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    const start = (page - 1) * pageSize;
    const response: PaginatedResponse<RequestStatusSummary> = {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
    return HttpResponse.json(response);
  }),

  http.get("/api/requests/:requestId", async ({ params }) => {
    await randomDelay();
    const detail = getRequestDetail(String(params.requestId));
    if (!detail) {
      return HttpResponse.json({ message: "Request not found" }, { status: 404 });
    }
    return HttpResponse.json(detail);
  }),
];
