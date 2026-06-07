import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
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
    const { playStyle } = body;

    if (!playStyle) {
      return NextResponse.json(
        {
          success: false,
          message: "PlayStyle is required",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        clerkId: userId,
      },
      data: {
        playStyle,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("PLAYSTYLE UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
