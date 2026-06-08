import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        position: true,
        playStyle: true,
        avatarUrl: true,
        strongFoot: true,
        bio: true,
        overall: true,
        matchesPlayed: true,
        wins: true,
        losses: true,
        draws: true,
        goals: true,
        assists: true,
        tackles: true,
        saves: true,
        intercepts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.fullName !== undefined) dataToUpdate.fullName = body.fullName;
    if (body.username !== undefined) dataToUpdate.username = body.username;
    if (body.avatar !== undefined) dataToUpdate.avatarUrl = body.avatar;
    if (body.position !== undefined) dataToUpdate.position = body.position;
    if (body.playStyle !== undefined) dataToUpdate.playStyle = body.playStyle;
    if (body.strongFoot !== undefined) dataToUpdate.strongFoot = body.strongFoot;
    if (body.bio !== undefined) dataToUpdate.bio = body.bio;
    
    // Stats
    if (typeof body.rating === 'number') dataToUpdate.overall = body.rating;
    if (typeof body.matchesPlayed === 'number') dataToUpdate.matchesPlayed = body.matchesPlayed;
    if (typeof body.wins === 'number') dataToUpdate.wins = body.wins;
    if (typeof body.losses === 'number') dataToUpdate.losses = body.losses;
    if (typeof body.draws === 'number') dataToUpdate.draws = body.draws;
    if (typeof body.goals === 'number') dataToUpdate.goals = body.goals;
    if (typeof body.assists === 'number') dataToUpdate.assists = body.assists;
    if (typeof body.tackles === 'number') dataToUpdate.tackles = body.tackles;
    if (typeof body.saves === 'number') dataToUpdate.saves = body.saves;
    if (typeof body.intercepts === 'number') dataToUpdate.intercepts = body.intercepts;

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("PATCH PROFILE ERROR:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
