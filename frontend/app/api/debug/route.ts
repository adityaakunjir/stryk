import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { username: true, fullName: true, position: true, playStyle: true }
  });
  return NextResponse.json({ users });
}
