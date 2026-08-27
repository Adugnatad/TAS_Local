import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const response = await fetch("targetUrl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
    });
    const body = await response.text();
    return NextResponse.json(JSON.parse(body), { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to validate TIN." }, { status: 502 });
  }
}
