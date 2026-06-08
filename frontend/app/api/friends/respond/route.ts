import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await req.json();
    if (!requestId || !action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid request payload" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }});

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }});

    if (!request) {
      return NextResponse.json({ success: false, message: "Friend request not found" }, { status: 404 });
    }

    if (request.receiverId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized to respond to this request" }, { status: 403 });
    }

    if (request.status !== "pending") {
      return NextResponse.json({ success: false, message: `Request already ${request.status}` }, { status: 400 });
    }

    if (action === "accept") {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" }});
      return NextResponse.json({ success: true, message: "Friend request accepted" });
    } else {
      // Rejecting a request
      await prisma.friendRequest.delete({
        where: { id: requestId }});
      return NextResponse.json({ success: true, message: "Friend request rejected" });
    }
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
