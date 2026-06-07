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
    const { matchId, teamName } = body; // teamName can be "Team A", "Team B", or null

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "matchId is required" },
        { status: 400 }
      );
    }

    // Find the participant entry for this user in the match
    const participant = await prisma.matchParticipant.findFirst({
      where: {
        matchId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "You are not a participant in this match. Join the match lobby first." },
        { status: 400 }
      );
    }

    // Update the participant's team mapping
    const updatedParticipant = await prisma.matchParticipant.update({
      where: { id: participant.id },
      data: {
        team: teamName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned to ${teamName || "Unassigned"}`,
      data: updatedParticipant,
    });
  } catch (error) {
    console.error("ASSIGN TEAM ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
