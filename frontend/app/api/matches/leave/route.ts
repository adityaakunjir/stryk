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
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      message: "Successfully left the match lobby",
    });
  } catch (error) {
    console.error("LEAVE MATCH ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
