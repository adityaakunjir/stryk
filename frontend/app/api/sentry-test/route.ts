import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const backend = searchParams.get("backend");

  if (backend) {
    // Forward to backend sentry-test (usually at http://127.0.0.1:8000/sentry-test)
    let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    // Strip "/api/v1" to get the host for health router
    const backendRootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    const targetUrl = `${backendRootUrl}/sentry-test`;

    try {
      console.log(`[Sentry Test] Fetching backend test from: ${targetUrl}`);
      const res = await fetch(targetUrl);
      const text = await res.text();
      return new NextResponse(text, { status: res.status });
    } catch (err) {
      console.error("[Sentry Test] Backend fetch failed:", err);
      Sentry.captureException(err);
      return NextResponse.json({ error: "Failed to reach backend test", details: String(err) }, { status: 500 });
    }
  }

  // Trigger frontend server-side route error
  try {
    throw new Error("Sentry Test Next.js Route Exception");
  } catch (err) {
    Sentry.captureException(err);
    // Return standard error response
    return NextResponse.json({ error: "Sentry test exception triggered on frontend server" }, { status: 500 });
  }
}
