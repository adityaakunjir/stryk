import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "open" | "upcoming" | "nearby"
    const locationQuery = searchParams.get("location");

    // Build Prisma query dynamically
    const where: any = {};

    // 1. Open Matches filter
    if (filter === "open") {
      where.status = "open";
    }

    // 2. Upcoming Matches filter
    if (filter === "upcoming") {
      where.dateTime = {
        gte: new Date()};
    }

    // 3. Nearby Matches filter
    if (locationQuery) {
      where.location = {
        contains: locationQuery,
        mode: "insensitive"};
    }

    // Fetch matches from the database
    const matches = await prisma.match.findMany({
      where,
      include: {
        participants: true},
      orderBy: {
        dateTime: "asc"}});

    // Map matches to include computed properties players and spotsLeft
    const formattedMatches = matches.map((match) => {
      const playersCount = match.participants.length;
      const spotsLeft = Math.max(0, match.maxPlayers - playersCount);

      return {
        id: match.id,
        title: match.title,
        location: match.location,
        dateTime: match.dateTime,
        maxPlayers: match.maxPlayers,
        status: match.status,
        creatorId: match.creatorId,
        createdAt: match.createdAt,
        players: playersCount,
        spotsLeft: spotsLeft};
    });

    return NextResponse.json({
      success: true,
      data: formattedMatches});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
