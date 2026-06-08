import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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
      return NextResponse.json({ success: false, message: "This invitation is not yours to accept" }, { status: 403 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ success: false, message: "Invitation has already been handled" }, { status: 400 });
    }

    // Check if the user is already a member of this team
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invite.teamId,
        userId: user.id
      }
    });

    // 1. Create TeamMember mapping if they are not already in the team
    if (!existingMember) {
      await prisma.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: user.id,
          role: "player"
        }
      });
    }

    // 2. Update Invite Status to 'accepted'
    const updatedInvite = await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "accepted" }
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
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
