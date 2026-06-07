import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
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
        {
          success: false,
          message: "User profile not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
