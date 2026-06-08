import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.route);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.route);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.route);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.route);
}

async function handleProxy(req: NextRequest, route: string[]) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    const path = route.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${token}`);
    
    // Remove host to avoid conflicts
    headers.delete("host");

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.clone().text();
      } catch (e) {
        // No body
      }
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      // Pass cache options or disable caching for API
      cache: "no-store",
    });

    const data = await response.text();
    
    // Forward the response
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
