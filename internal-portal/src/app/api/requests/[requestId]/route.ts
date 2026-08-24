import { NextResponse } from "next/server";
import { getRequestDetail } from "@/features/status-viewer/mocks/fixtures";

export async function GET(_: Request, { params }: { params: { requestId: string } }) {
  const detail = getRequestDetail(params.requestId);
  return detail
    ? NextResponse.json(detail)
    : NextResponse.json({ message: "Request not found" }, { status: 404 });
}
