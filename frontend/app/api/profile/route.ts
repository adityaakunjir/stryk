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
          message: "Unauthorized"},
        { status: 401 }
      );
    }

    const body = await req.json();

    const user = await prisma.user.upsert({
      where: {
        clerkId: userId},
      update: {
        fullName: body.fullName,
        username: body.username,
        avatarUrl: body.avatarUrl},
      create: {
        clerkId: userId,
        fullName: body.fullName,
        username: body.username,
        avatarUrl: body.avatarUrl}});



    return NextResponse.json({
      success: true,
      user});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}