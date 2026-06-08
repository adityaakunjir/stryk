import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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
        overall: true},
      take: 20, // Limit results
      orderBy: {
        overall: "desc", // Show highest rated players first
      }});

    return NextResponse.json({
      success: true,
      data: users});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
