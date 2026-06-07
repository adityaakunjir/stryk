import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    if (currentCount + 1 >= match.maxPlayers) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "full" },
      });
    }

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
