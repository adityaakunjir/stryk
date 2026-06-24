import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
if (!API_BASE_URL.endsWith("/api/v1") && !API_BASE_URL.endsWith("/api/v1/")) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, "") + "/api/v1";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getToken } = await auth();
    const token = await getToken();

    const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Match Fetch Proxy] Error:", error);
    return NextResponse.json(
      { success: false, detail: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getToken } = await auth();
    const token = await getToken();
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Match Update Proxy] Error:", error);
    return NextResponse.json(
      { success: false, detail: "Internal Server Error" },
      { status: 500 }
    );
  }
}
