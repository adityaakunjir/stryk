import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Fetch all requests involving the user
    const relationships = await prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            position: true,
            playStyle: true,
            overall: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            position: true,
            playStyle: true,
            overall: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends: any[] = [];
    const incomingRequests: any[] = [];
    const outgoingRequests: any[] = [];

    relationships.forEach((rel) => {
      const isSender = rel.senderId === user.id;
      const otherUser = isSender ? rel.receiver : rel.sender;

      if (rel.status === "accepted") {
        friends.push({
          id: rel.id, // relationship ID
          user: otherUser,
          createdAt: rel.createdAt,
        });
      } else if (rel.status === "pending") {
        if (isSender) {
          outgoingRequests.push({
            id: rel.id,
            user: otherUser,
            createdAt: rel.createdAt,
          });
        } else {
          incomingRequests.push({
            id: rel.id,
            user: otherUser,
            createdAt: rel.createdAt,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      friends,
      incomingRequests,
      outgoingRequests,
    });
  } catch (error) {
    console.error("[GET_FRIENDS_ERROR]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
