// STRYK Frontend - API Utility
// Handles fetching from the Python FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  // Extract token from Clerk if available (requires passing token from client components)
  // For server components, you can pass headers or auth token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Error";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // Ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// Draft API functions

export interface AvailablePlayer {
  playerId: string;
  username: string;
  position: string;
  playStyle: string;
  overall: number;
  rating: number;
  xp: number;
  level: number;
  wins: number;
  matches: number;
  strongFoot: string;
  avatarUrl: string;
}

export async function getAvailablePlayers(token: string): Promise<AvailablePlayer[]> {
  try {
    const response = await fetchAPI("/matches/available-players", {}, token);
    return response.players || [];
  } catch (error) {
    console.error("Failed to fetch available players:", error);
    return [];
  }
}

export interface PlayerPositionData {
  playerId: string;
  x?: number;
  y?: number;
}

export interface CreateMatchRequest {
  title: string;
  turf?: string;
  location: string;
  date_time: string;
  max_players: number;
  format: string;
  password?: string;
  discordLink?: string;
  teamA?: PlayerPositionData[];
  teamB?: PlayerPositionData[];
}

export async function createMatch(
  matchData: CreateMatchRequest,
  token: string
): Promise<any> {
  return fetchAPI(
    "/matches/",
    {
      method: "POST",
      body: JSON.stringify(matchData),
    },
    token
  );
}
