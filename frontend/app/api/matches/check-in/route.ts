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

    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "matchId is required" },
        { status: 400 }
      );
    }

    // Find the participant entry for this user in this match
    const participant = await prisma.matchParticipant.findFirst({
      where: {
        matchId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "You are not a participant in this match" },
        { status: 400 }
      );
    }

    if (participant.checkedIn) {
      return NextResponse.json({
        success: true,
        message: "You are already checked in",
        data: participant,
      });
    }

    // Update checkedIn status
    const updatedParticipant = await prisma.matchParticipant.update({
      where: { id: participant.id },
      data: { checkedIn: true },
    });

    // Trigger real-time update via Pusher
    await triggerPusherEvent(`match-${matchId}`, "player-checked-in", {
      userId: user.id,
      username: user.username,
      fullName: user.fullName || user.username,
      participantId: participant.id,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully checked in to the match",
      data: updatedParticipant,
    });
  } catch (error) {
    console.error("CHECK IN ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
