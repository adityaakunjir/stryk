/**
 * Team Utility Functions
 * Helper functions for team calculations, chemistry scoring, and player filtering
 */

export interface PlayerPosition {
  playerId: string;
  x: number;
  y: number;
  playerData?: any;
}

/**
 * Calculate average overall rating for a team
 */
export function calculateAverageRating(players: PlayerPosition[]): number {
  if (players.length === 0) return 0;

  const totalRating = players.reduce((sum, pos) => {
    const rating = pos.playerData?.overall || pos.playerData?.rating || 70;
    return sum + rating;
  }, 0);

  return Math.round(totalRating / players.length);
}

/**
 * Calculate win rate for a team
 */
export function calculateWinRate(players: PlayerPosition[]): number {
  if (players.length === 0) return 0;

  const stats = players.reduce(
    (acc, pos) => {
      const player = pos.playerData;
      return {
        wins: acc.wins + (player?.wins || 0),
        matches: acc.matches + (player?.matches || 0),
      };
    },
    { wins: 0, matches: 0 }
  );

  return stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;
}

/**
 * Calculate chemistry score between players
 * Based on position synergy and player connections
 */
export function calculateChemistry(players: PlayerPosition[]): number {
  if (players.length < 2) return 100;

  let chemistryScore = 100;
  const positionCounts: Record<string, number> = {};

  // Check position distribution
  players.forEach((pos) => {
    const position = pos.playerData?.position || "ST";
    positionCounts[position] = (positionCounts[position] || 0) + 1;
  });

  // Penalize if too many players in same position
  Object.values(positionCounts).forEach((count) => {
    if (count > 2) {
      chemistryScore -= (count - 2) * 5;
    }
  });

  // Check player level consistency (avoid huge gaps)
  const levels = players
    .map((p) => p.playerData?.level || 1)
    .filter((l) => l !== undefined);

  if (levels.length > 1) {
    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
    const maxDeviation = Math.max(...levels.map((l) => Math.abs(l - avgLevel)));

    if (maxDeviation > 10) {
      chemistryScore -= 10;
    }
  }

  return Math.max(0, Math.min(100, chemistryScore));
}

/**
 * Suggest best position for a player on the pitch based on their stats
 * Returns normalized coordinates (0-100)
 */
export function suggestPlayerPosition(
  player: any,
  teamSize: number,
  teamCount: number
): { x: number; y: number } {
  const position = player.position?.toUpperCase() || "ST";
  const isTeamA = teamCount === 0;

  // Base positioning logic based on role
  const positionMap: Record<string, { x: number; y: number }> = {
    GK: { x: 50, y: isTeamA ? 5 : 95 },
    CB: { x: 50, y: isTeamA ? 20 : 80 },
    LB: { x: 20, y: isTeamA ? 25 : 75 },
    RB: { x: 80, y: isTeamA ? 25 : 75 },
    CMF: { x: 50, y: isTeamA ? 45 : 55 },
    DMF: { x: 50, y: isTeamA ? 35 : 65 },
    AMF: { x: 50, y: isTeamA ? 55 : 45 },
    LMF: { x: 25, y: isTeamA ? 45 : 55 },
    RMF: { x: 75, y: isTeamA ? 45 : 55 },
    CF: { x: 50, y: isTeamA ? 70 : 30 },
    LWF: { x: 20, y: isTeamA ? 70 : 30 },
    RWF: { x: 80, y: isTeamA ? 70 : 30 },
    ST: { x: 50, y: isTeamA ? 75 : 25 },
  };

  let suggested = positionMap[position] || { x: 50, y: isTeamA ? 50 : 50 };

  // For smaller matches, adjust positions closer to center
  if (teamSize < 11) {
    const scaleFactor = teamSize / 11;
    suggested = {
      x: 50 + (suggested.x - 50) * scaleFactor,
      y: 50 + (suggested.y - 50) * scaleFactor * 0.8, // Less vertical adjustment
    };
  }

  return suggested;
}

/**
 * Filter players by position
 */
export function filterPlayersByPosition(players: any[], position: string): any[] {
  if (!position || position === "all") return players;
  return players.filter((p) => p.position?.toUpperCase() === position.toUpperCase());
}

/**
 * Sort players by various criteria
 */
export function sortPlayers(
  players: any[],
  sortBy: "rating" | "position" | "recent" | "level"
): any[] {
  const sorted = [...players];

  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => (b.overall || b.rating || 70) - (a.overall || a.rating || 70));

    case "position":
      const positionOrder: Record<string, number> = {
        GK: 0,
        CB: 1,
        LB: 2,
        RB: 3,
        CMF: 4,
        DMF: 5,
        AMF: 6,
        LMF: 7,
        RMF: 8,
        CF: 9,
        LWF: 10,
        RWF: 11,
        ST: 12,
      };
      return sorted.sort((a, b) => {
        const aPos = positionOrder[a.position?.toUpperCase() || "ST"] || 99;
        const bPos = positionOrder[b.position?.toUpperCase() || "ST"] || 99;
        return aPos - bPos;
      });

    case "level":
      return sorted.sort((a, b) => (b.level || 1) - (a.level || 1));

    case "recent":
    default:
      return sorted;
  }
}

/**
 * Check if team is balanced (no huge rating gaps, good position distribution)
 */
export function isTeamBalanced(players: PlayerPosition[]): {
  isBalanced: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (players.length === 0) {
    return { isBalanced: false, issues: ["Team is empty"] };
  }

  // Check position distribution
  const positionCounts: Record<string, number> = {};
  const requiredMinPositions = ["GK", "CB", "CMF", "CF"];

  players.forEach((pos) => {
    const position = pos.playerData?.position || "ST";
    positionCounts[position] = (positionCounts[position] || 0) + 1;
  });

  // Warn if no goalkeeper
  if (!positionCounts["GK"]) {
    issues.push("No goalkeeper in team");
  }

  // Warn if too many of same position
  Object.entries(positionCounts).forEach(([pos, count]) => {
    if (count > 5) {
      issues.push(`Too many ${pos} players (${count})`);
    }
  });

  // Check rating balance
  const ratings = players.map((p) => p.playerData?.overall || p.playerData?.rating || 70);
  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const maxRating = Math.max(...ratings);
  const minRating = Math.min(...ratings);

  if (maxRating - minRating > 20) {
    issues.push(`High rating gap: ${minRating}-${maxRating}`);
  }

  return {
    isBalanced: issues.length === 0,
    issues,
  };
}

/**
 * Generate formation recommendations based on available players
 */
export function suggestFormation(
  availablePlayers: any[],
  teamSize: number
): Record<string, any[]> {
  const formation: Record<string, any[]> = {};

  // Group by position
  availablePlayers.forEach((player) => {
    const pos = player.position || "ST";
    if (!formation[pos]) formation[pos] = [];
    formation[pos].push(player);
  });

  // Sort each position by rating
  Object.keys(formation).forEach((pos) => {
    formation[pos].sort((a, b) => (b.overall || b.rating || 70) - (a.overall || a.rating || 70));
  });

  return formation;
}
