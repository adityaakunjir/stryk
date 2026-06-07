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
    const { teamId, username } = body;

    if (!teamId || !username) {
      return NextResponse.json(
        { success: false, message: "teamId and username are required" },
        { status: 400 }
      );
    }

    // Get the sender's internal ID
    const sender = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!sender) {
      return NextResponse.json(
        { success: false, message: "Sender profile not found" },
        { status: 404 }
      );
    }

    // Find the receiver by username
    const receiver = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!receiver) {
      return NextResponse.json(
        { success: false, message: "Player not found" },
        { status: 404 }
      );
    }

    // Verify sender is part of the team
    const senderMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: sender.id,
      },
    });

    if (!senderMembership) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Check if an invite already exists
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        receiverId: receiver.id,
        status: "pending",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { success: false, message: "An invitation is already pending for this player" },
        { status: 400 }
      );
    }

    // Create the invitation
    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        senderId: sender.id,
        receiverId: receiver.id,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      data: invite,
    });
  } catch (error) {
    console.error("TEAM INVITE ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
