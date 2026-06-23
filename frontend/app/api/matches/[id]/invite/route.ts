import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { triggerPusherEvent } from "@/lib/pusher";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
if (!API_BASE_URL.endsWith("/api/v1") && !API_BASE_URL.endsWith("/api/v1/")) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, "") + "/api/v1";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const bodyText = await req.text();
    let bodyObj;
    try {
      bodyObj = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
    }

    const receiverId = bodyObj.receiverId;
    if (!receiverId) {
      return NextResponse.json({ detail: "receiverId is required" }, { status: 400 });
    }

    // Call backend API
    const url = `${API_BASE_URL}/matches/${id}/invite`;
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: bodyText,
      cache: "no-store",
    });

    const data = await response.json();

    // If successfully created or already invited, trigger Pusher event
    if (response.ok && data.success) {
      const payload = {
        matchId: id,
        senderName: bodyObj.senderName || "A friend",
        senderAvatar: bodyObj.senderAvatar || null,
        matchTitle: bodyObj.matchTitle || "a match"
      };

      await triggerPusherEvent(`user-${receiverId}`, "match-invite", payload);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[INVITE PROXY] Error:", error);
    return NextResponse.json({ detail: "Internal Proxy Error" }, { status: 500 });
  }
}
