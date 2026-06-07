import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
        { success: false, message: "User profile not found." },
        { status: 404 }
      );
    }

    // Find the first team the user is a member of
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    username: true,
                    avatarUrl: true,
                    position: true,
                    overall: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teamMembership || !teamMembership.team) {
      return NextResponse.json({
        success: true,
        team: null,
      });
    }

    return NextResponse.json({
      success: true,
      team: teamMembership.team,
    });
  } catch (error) {
    console.error("GET MY TEAM ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
