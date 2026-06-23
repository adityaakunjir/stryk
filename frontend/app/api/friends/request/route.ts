import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { triggerPusherEvent } from "@/lib/pusher";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
if (!API_BASE_URL.endsWith("/api/v1") && !API_BASE_URL.endsWith("/api/v1/")) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, "") + "/api/v1";
}

export async function POST(req: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    const url = `${API_BASE_URL}/friends/request`;
    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.delete("host");

    const bodyText = await req.text();

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: bodyText,
      cache: "no-store",
    });

    const data = await response.json();
    
    // If backend reports success, trigger pusher
    if (data.success && data.targetUserClerkId && data.senderName) {
      const channelName = `user-${data.targetUserClerkId}`;
      await triggerPusherEvent(channelName, "friend-request", {
        senderName: data.senderName,
      });
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Proxy error in /api/friends/request:", error);
    Sentry.captureException(error, {
      tags: { service: "api_proxy_friends" }
    });
    return NextResponse.json({ detail: "Internal Proxy Error" }, { status: 500 });
  }
}
