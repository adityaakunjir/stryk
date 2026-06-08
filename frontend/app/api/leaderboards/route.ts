import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// High-fidelity mock CAM players
const mockCAMs = [
  { id: "mock-cam-1", username: "kdb_17", fullName: "Kevin De Bruyne", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=KDB", overall: 91, position: "CAM", playStyle: "Playmaker" },
  { id: "mock-cam-2", username: "belli_5", fullName: "Jude Bellingham", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=JB", overall: 89, position: "CAM", playStyle: "Box-to-Box" },
  { id: "mock-cam-3", username: "odegaard_8", fullName: "Martin Ødegaard", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=MO", overall: 87, position: "CAM", playStyle: "Playmaker" },
  { id: "mock-cam-4", username: "musiala_42", fullName: "Jamal Musiala", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=JM", overall: 86, position: "CAM", playStyle: "Speedster" },
  { id: "mock-cam-5", username: "wirtz_10", fullName: "Florian Wirtz", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=FW", overall: 86, position: "CAM", playStyle: "Playmaker" },
  { id: "mock-cam-6", username: "pedri_8", fullName: "Pedri González", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=PG", overall: 85, position: "CAM", playStyle: "Playmaker" },
  { id: "mock-cam-7", username: "maddison_10", fullName: "James Maddison", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=JMa", overall: 84, position: "CAM", playStyle: "Playmaker" },
];

// High-fidelity mock ST players
const mockSTs = [
  { id: "mock-st-1", username: "haaland_9", fullName: "Erling Haaland", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=EH", overall: 91, position: "ST", playStyle: "Poacher" },
  { id: "mock-st-2", username: "mbappe_10", fullName: "Kylian Mbappé", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=KM", overall: 91, position: "ST", playStyle: "Speedster" },
  { id: "mock-st-3", username: "kane_9", fullName: "Harry Kane", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=HK", overall: 90, position: "ST", playStyle: "Poacher" },
  { id: "mock-st-4", username: "lewandowski_9", fullName: "Robert Lewandowski", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=RL", overall: 88, position: "ST", playStyle: "Poacher" },
  { id: "mock-st-5", username: "martinez_10", fullName: "Lautaro Martínez", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=LM", overall: 87, position: "ST", playStyle: "Poacher" },
  { id: "mock-st-6", username: "osimhen_9", fullName: "Victor Osimhen", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=VO", overall: 86, position: "ST", playStyle: "Speedster" },
  { id: "mock-st-7", username: "isak_14", fullName: "Alexander Isak", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AI", overall: 84, position: "ST", playStyle: "Speedster" },
];

// High-fidelity mock GK players
const mockGKs = [
  { id: "mock-gk-1", username: "courtois_1", fullName: "Thibaut Courtois", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=TC", overall: 90, position: "GK", playStyle: "Goalkeeper" },
  { id: "mock-gk-2", username: "alisson_1", fullName: "Alisson Becker", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AB", overall: 89, position: "GK", playStyle: "Goalkeeper" },
  { id: "mock-gk-3", username: "terstegen_1", fullName: "Marc-André ter Stegen", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=MAT", overall: 89, position: "GK", playStyle: "Goalkeeper" },
  { id: "mock-gk-4", username: "ederson_31", fullName: "Ederson Moraes", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=EM", overall: 88, position: "GK", playStyle: "Goalkeeper" },
  { id: "mock-gk-5", username: "oblak_13", fullName: "Jan Oblak", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=JO", overall: 87, position: "GK", playStyle: "Goalkeeper" },
  { id: "mock-gk-6", username: "maignan_16", fullName: "Mike Maignan", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=MMa", overall: 86, position: "GK", playStyle: "Goalkeeper" },
  { id: "mock-gk-7", username: "donnarumma_99", fullName: "Gianluigi Donnarumma", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=GD", overall: 86, position: "GK", playStyle: "Goalkeeper" },
];

// High-fidelity mock Teams
const mockTeams = [
  { id: "mock-team-1", name: "Stryk United", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=StrykUnited", wins: 22, draws: 5, losses: 3 },
  { id: "mock-team-2", name: "Apex FC", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=ApexFC", wins: 19, draws: 7, losses: 4 },
  { id: "mock-team-3", name: "Phoenix Turf Club", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=PhoenixTurf", wins: 18, draws: 6, losses: 6 },
  { id: "mock-team-4", name: "Galacticos", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=Galacticos", wins: 15, draws: 10, losses: 5 },
  { id: "mock-team-5", name: "Street Ballers", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=StreetBallers", wins: 14, draws: 8, losses: 8 },
  { id: "mock-team-6", name: "Vanguard FC", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=VanguardFC", wins: 12, draws: 10, losses: 8 },
  { id: "mock-team-7", name: "Tiki Taka FC", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=TikiTaka", wins: 11, draws: 12, losses: 7 },
];

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ─── Fetch real players from DB ─────────────────────────────────
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        overall: true,
        position: true,
        playStyle: true}});

    // ─── Fetch real teams from DB ──────────────────────────────────
    const dbTeams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        wins: true,
        draws: true,
        losses: true}});

    // ─── Process CAM Leaderboard ────────────────────────────────────
    const realCAMs = dbUsers
      .filter((u) => u.position === "CAM")
      .map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName || u.username,
        avatarUrl: u.avatarUrl || "",
        overall: u.overall,
        position: u.position || "CAM",
        playStyle: u.playStyle || "Playmaker"}));
    const combinedCAMs = [...realCAMs, ...mockCAMs];
    // Filter duplicates by username (keeping DB version if matches)
    const uniqueCAMs = Array.from(
      combinedCAMs.reduce((map, p) => map.set(p.username, p), new Map()).values()
    ).sort((a, b) => b.overall - a.overall).slice(0, 10);

    // ─── Process ST Leaderboard ─────────────────────────────────────
    const realSTs = dbUsers
      .filter((u) => u.position === "ST")
      .map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName || u.username,
        avatarUrl: u.avatarUrl || "",
        overall: u.overall,
        position: u.position || "ST",
        playStyle: u.playStyle || "Poacher"}));
    const combinedSTs = [...realSTs, ...mockSTs];
    const uniqueSTs = Array.from(
      combinedSTs.reduce((map, p) => map.set(p.username, p), new Map()).values()
    ).sort((a, b) => b.overall - a.overall).slice(0, 10);

    // ─── Process GK Leaderboard ─────────────────────────────────────
    const realGKs = dbUsers
      .filter((u) => u.position === "GK")
      .map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName || u.username,
        avatarUrl: u.avatarUrl || "",
        overall: u.overall,
        position: u.position || "GK",
        playStyle: u.playStyle || "Goalkeeper"}));
    const combinedGKs = [...realGKs, ...mockGKs];
    const uniqueGKs = Array.from(
      combinedGKs.reduce((map, p) => map.set(p.username, p), new Map()).values()
    ).sort((a, b) => b.overall - a.overall).slice(0, 10);

    // ─── Process Teams Leaderboard ──────────────────────────────────
    const realTeams = dbTeams.map((t) => ({
      id: t.id,
      name: t.name,
      logoUrl: t.logoUrl || "",
      wins: t.wins,
      draws: t.draws,
      losses: t.losses}));
    const combinedTeams = [...realTeams, ...mockTeams];
    const uniqueTeams = Array.from(
      combinedTeams.reduce((map, t) => map.set(t.name, t), new Map()).values()
    )
      .sort((a, b) => {
        const pointsA = a.wins * 3 + a.draws;
        const pointsB = b.wins * 3 + b.draws;
        if (pointsB !== pointsA) return pointsB - pointsA;
        return b.wins - a.wins; // tie-breaker by wins
      })
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        CAM: uniqueCAMs,
        ST: uniqueSTs,
        GK: uniqueGKs,
        Teams: uniqueTeams}});
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
