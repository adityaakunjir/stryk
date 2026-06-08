import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing target user ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ success: false, message: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "Target user not found" }, { status: 404 });
    }

    // Check if a relationship already exists
    const existingRel = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id },
        ],
      },
    });

    if (existingRel) {
      if (existingRel.status === "accepted") {
        return NextResponse.json({ success: false, message: "Already friends" }, { status: 400 });
      }
      if (existingRel.status === "pending") {
        return NextResponse.json({ success: false, message: "Friend request already pending" }, { status: 400 });
      }
      
      // If rejected, we might allow sending again or updating the status to pending
      // For simplicity, we just update it to pending and set the sender to the current user
      await prisma.friendRequest.update({
        where: { id: existingRel.id },
        data: {
          senderId: user.id,
          receiverId: targetUserId,
          status: "pending",
        },
      });

      return NextResponse.json({ success: true, message: "Friend request sent" });
    }

    // Create new friend request
    await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: targetUserId,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, message: "Friend request sent" });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
