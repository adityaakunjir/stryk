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
      where: { clerkId }});

    if (!sender) {
      return NextResponse.json(
        { success: false, message: "Sender profile not found" },
        { status: 404 }
      );
    }

    // Find the receiver by username
    const receiver = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }});

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
        userId: sender.id}});

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
        status: "pending"}});

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
        status: "pending"}});

    return NextResponse.json({
      success: true,
      data: invite});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

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
      where: { clerkId }});

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    const invites = await prisma.teamInvite.findMany({
      where: {
        receiverId: user.id,
        status: "pending"},
      orderBy: {
        createdAt: "desc"}});

    const populatedInvites = await Promise.all(
  invites.map(async (invite: any) => {
        const team = await prisma.team.findUnique({
          where: { id: invite.teamId },
          select: { name: true, logoUrl: true }});
        return {
          id: invite.id,
          teamId: invite.teamId,
          teamName: team?.name || "Unknown Team",
          teamLogo: team?.logoUrl || "",
          status: invite.status,
          createdAt: invite.createdAt};
      })
    );

    return NextResponse.json({
      success: true,
      invites: populatedInvites});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json({ success: false, message: "inviteId is required" }, { status: 400 });
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) {
      return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 });
    }

    if (invite.receiverId !== user.id) {
      return NextResponse.json({ success: false, message: "This invitation is not yours to decline" }, { status: 403 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ success: false, message: "Invitation has already been handled" }, { status: 400 });
    }

    // Update Invite Status to 'declined'
    const updatedInvite = await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "declined" }
    });

    return NextResponse.json({
      success: true,
      message: "Invitation declined successfully",
      data: updatedInvite
    });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
