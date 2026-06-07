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
    const { inviteId, action } = body;

    if (!inviteId || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "inviteId and action ('accept' or 'decline') are required" },
        { status: 400 }
      );
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) {
      return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 });
    }

    if (invite.receiverId !== user.id) {
      return NextResponse.json({ success: false, message: "This invitation is not for you" }, { status: 403 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ success: false, message: "Invitation has already been handled" }, { status: 400 });
    }

    if (action === "accept") {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invite.teamId,
          userId: user.id
        }
      });

      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "accepted" }
      });

      if (!existingMember) {
        await prisma.teamMember.create({
          data: {
            teamId: invite.teamId,
            userId: user.id,
            role: "player"
          }
        });
      }

      return NextResponse.json({ success: true, message: "Invitation accepted" });
    } else {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "declined" }
      });

      return NextResponse.json({ success: true, message: "Invitation declined" });
    }
  } catch (error) {
    console.error("INVITE RESPOND ERROR:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
