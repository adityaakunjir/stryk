import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { triggerPusherEvent } from "@/lib/pusher-server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getToken } = await auth();
    const token = await getToken();

    const response = await fetch(`${API_URL}/matches/${id}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Trigger real-time event so all connected clients get notified
      await triggerPusherEvent(`match-${id}`, "match-closed", {
        matchId: id,
        status: "closed",
      });
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Match Close Proxy] Error:", error);
    return NextResponse.json(
      { success: false, detail: "Internal Server Error" },
      { status: 500 }
    );
  }
}
