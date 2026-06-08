import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerPusherEvent } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: "Invalid JSON payload" }, { status: 400 });
    }
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "matchId is required" },
        { status: 400 }
      );
    }

    // Check if match exists and if user is creator
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ success: false, message: "Match not found" }, { status: 404 });
    }

    if (match.creatorId === user.id) {
      return NextResponse.json(
        { success: false, message: "Match creator cannot leave. Please cancel the match instead." },
        { status: 403 }
      );
    }

    // Find the participant entry
    const participant = await prisma.matchParticipant.findFirst({
      where: {
        matchId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "You are not a participant in this match" },
        { status: 404 }
      );
    }

    // Remove the participant inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete the MatchParticipant row
      await tx.matchParticipant.delete({
        where: { id: participant.id },
      });

      // 2. Since a player left, make sure the Match status is set to "open"
      await tx.match.update({
        where: { id: matchId },
        data: { status: "open" },
      });
    });

    // Trigger Pusher event
    await triggerPusherEvent(`match-${matchId}`, "player-left", {
      userId: user.id,
      participantId: participant.id,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully left the match lobby",
    });
  } catch (error) {
    console.error("LEAVE MATCH ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
