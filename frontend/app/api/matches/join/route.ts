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

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    // Check if match is already full
    const currentCount = match.participants.length;
    if (currentCount >= match.maxPlayers) {
      return NextResponse.json(
        { success: false, message: "This match is already full" },
        { status: 400 }
      );
    }

    // Check if the user is already a participant
    const isAlreadyParticipating = match.participants.some(
      (p) => p.userId === user.id
    );

    if (isAlreadyParticipating) {
      return NextResponse.json(
        { success: false, message: "You have already joined this match" },
        { status: 400 }
      );
    }

    // Join the match
    const participant = await prisma.matchParticipant.create({
      data: {
        matchId,
        userId: user.id,
        team: null, // Initially unassigned
      },
    });

    // If match is now full, update its status to "full"
    const isFull = currentCount + 1 >= match.maxPlayers;
    if (isFull) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "full" },
      });
    }

    const participantWithUser = await prisma.matchParticipant.findUnique({
      where: { id: participant.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            overall: true,
            position: true,
            playStyle: true,
          },
        },
      },
    });

    // Trigger Pusher event
    await triggerPusherEvent(`match-${matchId}`, "player-joined", {
      participant: participantWithUser,
      isFull,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the match lobby",
      data: participant,
    });
  } catch (error) {
    console.error("JOIN MATCH ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
