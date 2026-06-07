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
    console.error("DECLINE INVITE ERROR:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
