import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { triggerPusherEvent } from "@/lib/pusher";

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

    // --- PUSHER INTERCEPTION LOGIC ---
    if (response.ok && req.method === "POST") {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.success) {
          let matchId = "";
          let parsedBody: any = {};
          if (body) {
            try { parsedBody = JSON.parse(body); } catch {}
          }
          
          if (["join", "leave", "balance", "check-in", "assign-team"].includes(subpath)) {
            matchId = parsedBody.matchId;
          } else if (path.length === 2 && (
            path[1] === "kick" || path[1] === "start" || path[1] === "save-teams" || 
            path[1] === "close" || path[1] === "submit-stats" || path[1] === "reconcile" ||
            path[1] === "pending-verifications" || path[1] === "verify" || path[1] === "finalize-verifications"
          )) {
            matchId = path[0];
          }

          if (matchId) {
            const channelName = `match-${matchId}`;
            
            if (subpath === "join") {
              const participants = jsonData.data?.participants || [];
              let latestParticipant = participants.length > 0 ? participants[0] : null;
              if (participants.length > 0) {
                latestParticipant = participants.reduce((latest: any, current: any) => {
                  if (!latest.joinedAt) return current;
                  if (!current.joinedAt) return latest;
                  return new Date(current.joinedAt) > new Date(latest.joinedAt) ? current : latest;
                });
              }
              const isFull = participants.length >= (jsonData.data?.maxPlayers || 22);
              await triggerPusherEvent(channelName, "player-joined", { participant: latestParticipant, isFull });
            } else if (subpath === "leave" || (path.length === 2 && path[1] === "kick")) {
              await triggerPusherEvent(channelName, "player-left", { userId: "someone", participantId: "unknown" });
            } else if (path.length === 2 && path[1] === "start") {
              await triggerPusherEvent(channelName, "match-started", {});
            } else if (path.length === 2 && path[1] === "close") {
              await triggerPusherEvent(channelName, "match-closed", {});
            } else if (subpath === "check-in") {
              await triggerPusherEvent(channelName, "player-checked-in", { fullName: "A player" });
            } else if (subpath === "assign-team") {
              await triggerPusherEvent(channelName, "team-assigned", { team: parsedBody.team, participantId: parsedBody.participantId });
            } else if (path.length === 2 && path[1] === "submit-stats") {
              await triggerPusherEvent(channelName, "stats-submitted", {});
            } else if (subpath === "balance" || (path.length === 2 && path[1] === "save-teams")) {
              await triggerPusherEvent(channelName, "teams-balanced", {});
            } else if (path.length === 2 && path[1] === "invite") {
              const receiverId = parsedBody.receiverId;
              if (receiverId) {
                await triggerPusherEvent(`user-${receiverId}`, "match-invite", {
                  matchId: path[0],
                  senderName: parsedBody.senderName || "A friend",
                  senderAvatar: parsedBody.senderAvatar || null,
                  matchTitle: parsedBody.matchTitle || "a match"
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("[PROXY] Failed to parse response or trigger pusher:", e);
      }
    }
    // --- END PUSHER INTERCEPTION ---

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
