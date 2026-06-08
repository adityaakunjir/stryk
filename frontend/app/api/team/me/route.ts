import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }});

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 404 }
      );
    }

    // Find the first team the user is a member of
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: user.id},
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    username: true,
                    avatarUrl: true,
                    position: true,
                    overall: true}}}}}}}});

    if (!teamMembership || !teamMembership.team) {
      return NextResponse.json({
        success: true,
        team: null});
    }

    return NextResponse.json({
      success: true,
      team: teamMembership.team,
      userRole: teamMembership.role,
      userId: user.id});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { teamId, action, name, logoUrl, memberId, newCaptainMemberId } = body;

    if (!teamId) {
      return NextResponse.json({ success: false, message: "teamId is required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    if (team.captainId !== user.id) {
      return NextResponse.json({ success: false, message: "Only the captain can modify team settings" }, { status: 403 });
    }

    if (action === "kick") {
      if (!memberId) {
        return NextResponse.json({ success: false, message: "memberId is required to kick a member" }, { status: 400 });
      }

      const memberToKick = await prisma.teamMember.findUnique({
        where: { id: memberId }
      });

      if (!memberToKick) {
        return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
      }

      if (memberToKick.teamId !== teamId) {
        return NextResponse.json({ success: false, message: "Member does not belong to this team" }, { status: 400 });
      }

      if (memberToKick.userId === user.id) {
        return NextResponse.json({ success: false, message: "You cannot remove yourself from the team. Transfer captaincy first." }, { status: 400 });
      }

      await prisma.teamMember.delete({
        where: { id: memberId }
      });

      return NextResponse.json({
        success: true,
        message: "Member removed successfully"
      });
    }

    if (action === "transfer-captaincy") {
      if (!newCaptainMemberId) {
        return NextResponse.json({ success: false, message: "newCaptainMemberId is required to transfer captaincy" }, { status: 400 });
      }

      const targetMember = await prisma.teamMember.findUnique({
        where: { id: newCaptainMemberId }
      });

      if (!targetMember) {
        return NextResponse.json({ success: false, message: "Target member not found" }, { status: 404 });
      }

      if (targetMember.teamId !== teamId) {
        return NextResponse.json({ success: false, message: "Target member does not belong to this team" }, { status: 400 });
      }

      if (targetMember.userId === user.id) {
        return NextResponse.json({ success: false, message: "You are already the captain" }, { status: 400 });
      }

      const currentCaptainMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id
        }
      });

      if (!currentCaptainMember) {
        return NextResponse.json({ success: false, message: "Current captain membership not found" }, { status: 500 });
      }

      await prisma.$transaction([
        prisma.team.update({
          where: { id: teamId },
          data: { captainId: targetMember.userId }
        }),
        prisma.teamMember.update({
          where: { id: currentCaptainMember.id },
          data: { role: "player" }
        }),
        prisma.teamMember.update({
          where: { id: newCaptainMemberId },
          data: { role: "captain" }
        })
      ]);

      return NextResponse.json({
        success: true,
        message: "Captaincy transferred successfully"
      });
    }

    // Default: update team name/logo
    const updateData: { name?: string; logoUrl?: string | null } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ success: false, message: "Invalid team name" }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl || null;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "Team updated successfully",
      data: updatedTeam
    });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ success: false, message: "teamId parameter is required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 });
    }

    if (team.captainId !== user.id) {
      return NextResponse.json({ success: false, message: "Only the captain can delete the team" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.teamMember.deleteMany({
        where: { teamId }
      }),
      prisma.teamInvite.deleteMany({
        where: { teamId }
      }),
      prisma.team.delete({
        where: { id: teamId }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Team disbanded successfully"
    });
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
