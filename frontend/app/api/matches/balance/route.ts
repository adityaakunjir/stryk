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
      where: { clerkId }});

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON payload" }, { status: 400 });
    }
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "matchId is required" },
        { status: 400 }
      );
    }

    // Fetch the match and all participants with user profiles
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                overall: true,
                position: true,
                playStyle: true}}}}}});

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    if (match.creatorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only the match creator can balance teams." },
        { status: 403 }
      );
    }

    const participants = match.participants;

    if (participants.length < 2) {
      return NextResponse.json(
        { success: false, message: "Need at least 2 players to balance teams" },
        { status: 400 }
      );
    }

    // Build player list with ratings for the balancer
    const players = participants.map((p) => ({
      participantId: p.id,
      id: p.user.id,
      username: p.user.username,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
      position: p.user.position,
      playStyle: p.user.playStyle,
      rating: p.user.overall}));

    // ─── Greedy Partition Algorithm ────────────────────────────────
    // Sort players by rating descending, assign to the team with
    // the lower cumulative rating. This minimises the rating gap.
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const teamA: typeof players = [];
    const teamB: typeof players = [];
    let sumA = 0;
    let sumB = 0;

    for (const player of sorted) {
      if (sumA <= sumB) {
        teamA.push(player);
        sumA += player.rating;
      } else {
        teamB.push(player);
        sumB += player.rating;
      }
    }

    // Persist the team assignments in the database
    const updatePromises = [
      ...teamA.map((p) =>
        prisma.matchParticipant.update({
          where: { id: p.participantId },
          data: { team: "Team A" }})
      ),
      ...teamB.map((p) =>
        prisma.matchParticipant.update({
          where: { id: p.participantId },
          data: { team: "Team B" }})
      ),
    ];

    await Promise.all(updatePromises);

    // Trigger real-time update via Pusher
    await triggerPusherEvent(`match-${matchId}`, "teams-balanced", {
      teamA: teamA.map((p) => ({ id: p.id, username: p.username, fullName: p.fullName })),
      teamB: teamB.map((p) => ({ id: p.id, username: p.username, fullName: p.fullName })),
      ratingDiff: Math.abs(sumA - sumB)});

    return NextResponse.json({
      success: true,
      message: "Teams balanced successfully",
      data: {
        teamA,
        teamB,
        ratingDiff: Math.abs(sumA - sumB),
        avgA: teamA.length > 0 ? Math.round(sumA / teamA.length) : 0,
        avgB: teamB.length > 0 ? Math.round(sumB / teamB.length) : 0}});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
