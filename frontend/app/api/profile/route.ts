import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/profile${searchParams ? `?${searchParams}` : ""}`;

    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.delete("host");

    const body = await req.clone().text();

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ detail: "Internal Proxy Error" }, { status: 500 });
  }
}
