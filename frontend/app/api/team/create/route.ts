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

    const body = await req.json();
    const { name, logoUrl } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, message: "Team name is required" },
        { status: 400 }
      );
    }

    // Get the internal User ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found. Please create your profile first." },
        { status: 404 }
      );
    }

    // Create the team and the team member relationship in a single transaction
    const newTeam = await prisma.team.create({
      data: {
        name,
        logoUrl: logoUrl || null,
        captainId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "captain",
          },
        },
      },
      include: {
        members: true, // Return members in the response
      },
    });

    return NextResponse.json({
      success: true,
      data: newTeam,
    });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
