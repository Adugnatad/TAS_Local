import { NextResponse } from "next/server";
import { requests } from "@/app/api/_data/store";
import type { RequestStatusSummary } from "@/features/status-viewer/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const type = url.searchParams.get("type") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const customerId = url.searchParams.get("customerId") ?? "";
  const sortBy = url.searchParams.get("sortBy") ?? "lastUpdatedAt";
  const sortOrder = url.searchParams.get("sortOrder") ?? "desc";
  const filtered = requests
    .filter(
      (item) =>
        !search ||
        [item.customerName, item.id, item.currentStage].some((value) =>
          value.toLowerCase().includes(search),
        ),
    )
    .filter((item) => !type || item.type === type)
    .filter((item) => !status || item.status === status)
    .filter((item) => !customerId || item.customerId === customerId)
    .sort((a, b) => {
      const left = a[sortBy as keyof RequestStatusSummary];
      const right = b[sortBy as keyof RequestStatusSummary];
      const direction = sortOrder === "asc" ? 1 : -1;
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      if (typeof left === "string" && typeof right === "string")
        return (left > right ? 1 : left < right ? -1 : 0) * direction;
      return 0;
    });

  return NextResponse.json({
    data: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  });
}
