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

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found. Please create your profile first." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, location, dateTime, maxPlayers } = body;

    // Validate request inputs
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    if (!location || typeof location !== "string" || !location.trim()) {
      return NextResponse.json(
        { success: false, message: "Location is required" },
        { status: 400 }
      );
    }

    if (!dateTime || isNaN(Date.parse(dateTime))) {
      return NextResponse.json(
        { success: false, message: "A valid date and time is required" },
        { status: 400 }
      );
    }

    const maxPlayersInt = parseInt(maxPlayers, 10);
    if (isNaN(maxPlayersInt) || maxPlayersInt <= 0) {
      return NextResponse.json(
        { success: false, message: "Maximum players must be a positive number" },
        { status: 400 }
      );
    }

    // Create match and add creator as a participant inside a transaction
    const newMatch = await prisma.$transaction(async (tx) => {
      // 1. Create the Match
      const match = await tx.match.create({
        data: {
          title: title.trim(),
          location: location.trim(),
          dateTime: new Date(dateTime),
          maxPlayers: maxPlayersInt,
          creatorId: user.id,
        },
      });

      // 2. Add creator to MatchParticipant
      await tx.matchParticipant.create({
        data: {
          matchId: match.id,
          userId: user.id,
          team: null, // Initially unassigned
        },
      });

      // 3. Return the match with participants
      return tx.match.findUnique({
        where: { id: match.id },
        include: {
          participants: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: newMatch,
    });
  } catch (error) {
    console.error("CREATE MATCH ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
