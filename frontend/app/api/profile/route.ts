import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    console.log("=================================");
    console.log("USER ID:", userId);
    console.log("BODY:", body);
    console.log("ABOUT TO UPSERT");
    console.log("=================================");

    const user = await prisma.user.upsert({
      where: {
        clerkId: userId,
      },
      update: {
        fullName: body.fullName,
        username: body.username,
        avatarUrl: body.avatarUrl,
      },
      create: {
        clerkId: userId,
        fullName: body.fullName,
        username: body.username,
        avatarUrl: body.avatarUrl,
      },
    });

    console.log("USER SAVED:", user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("=================================");
    console.error("PROFILE ERROR:", error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}