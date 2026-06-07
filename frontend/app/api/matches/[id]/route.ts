import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Match ID is required" },
        { status: 400 }
      );
    }

    // Fetch the match and include participants and their profile data
    const match = await prisma.match.findUnique({
      where: { id },
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
                playStyle: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    // Fetch the match creator's profile (Captain/Host)
    const creator = await prisma.user.findUnique({
      where: { id: match.creatorId },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        overall: true,
        position: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...match,
        creator,
      },
    });
  } catch (error) {
    console.error("GET MATCH DETAIL ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
