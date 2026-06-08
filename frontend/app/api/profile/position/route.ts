import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: "Invalid JSON payload" }, { status: 400 });
    }
    const { position } = body;

    if (!position) {
      return NextResponse.json(
        { success: false, message: "Position is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: { position },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
