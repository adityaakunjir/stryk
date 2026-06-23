import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
if (!API_BASE_URL.endsWith("/api/v1") && !API_BASE_URL.endsWith("/api/v1/")) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, "") + "/api/v1";
}

async function proxyRequest(req: NextRequest, path: string[]) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    const subpath = path.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/matches/${subpath}${searchParams ? `?${searchParams}` : ""}`;

    console.log(`[PROXY] ${req.method} ${url}`);

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    let body: string | undefined = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.clone().text();
      } catch {
        // No body
      }
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await response.text();
    console.log(`[PROXY] Response ${response.status}: ${data.substring(0, 200)}`);

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[PROXY] Error:", error);
    Sentry.captureException(error, { tags: { service: "matches_proxy" } });
    return NextResponse.json({ detail: "Internal Proxy Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}
