import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const position = searchParams.get("pos") || "";
    const playStyle = searchParams.get("style") || "";

    if (!query && !position && !playStyle) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Build the where clause dynamically
    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { username: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
      ];
    }

    if (position) {
      whereClause.position = position;
    }

    if (playStyle) {
      whereClause.playStyle = playStyle;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        position: true,
        playStyle: true,
        overall: true,
      },
      take: 20, // Limit results
      orderBy: {
        overall: "desc", // Show highest rated players first
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
