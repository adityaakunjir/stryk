"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useStrykAuth } from "./auth-provider";
import { calculateStats, calculateOvr } from "@/lib/stat-utils";

export type PlayStyleType = "Speedster" | "Playmaker" | "Poacher" | "Box-to-Box";

export interface PlayerData {
  id?: number;
  fullName: string;
  username: string;
  avatar: string; // base64 or url
  position: string;
  secondaryPosition: string;
  strongFoot: "Left" | "Right";
  playStyle: PlayStyleType;
  bio: string;
  rating: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  tackles?: number;
  saves?: number;
  intercepts?: number;
}

interface PlayerContextType {
  playerData: PlayerData;
  updatePlayerData: (data: Partial<PlayerData>) => void;
  resetPlayerData: () => void;
  getStats: () => { label: string; value: number }[];
  isLoaded: boolean;
  isBackendSynced: boolean;
}

type BackendPlayer = {
  id?: number;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  position?: string;
  secondary_position?: string;
  strong_foot?: string;
  play_style?: PlayStyleType;
  bio?: string;
  rating?: number;
  matches_played?: number;
  goals?: number;
  assists?: number;
  tackles?: number;
  saves?: number;
  intercepts?: number;
};

const defaultPlayerData: PlayerData = {
  fullName: "",
  username: "",
  avatar: "",
  position: "CAM",
  secondaryPosition: "",
  strongFoot: "Left",
  playStyle: "Playmaker",
  bio: "Creative playmaker looking to dominate the midfield and assist the attack.",
  rating: 60,
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
  tackles: 0,
  saves: 0,
  intercepts: 0,
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function toCamelCase(backendPlayer: BackendPlayer): PlayerData {
  return {
    id: backendPlayer.id,
    fullName: backendPlayer.full_name || "",
    username: backendPlayer.username || "",
    avatar: backendPlayer.avatar_url || "",
    position: backendPlayer.position || "CAM",
    secondaryPosition: backendPlayer.secondary_position || "",
    strongFoot: backendPlayer.strong_foot === "Left" ? "Left" : "Right",
    playStyle: backendPlayer.play_style || "Playmaker",
    bio: backendPlayer.bio || "",
    rating: backendPlayer.rating || 60,
    matchesPlayed: backendPlayer.matches_played ?? 0,
    goals: backendPlayer.goals ?? 0,
    assists: backendPlayer.assists ?? 0,
    tackles: backendPlayer.tackles ?? 0,
    saves: backendPlayer.saves ?? 0,
    intercepts: backendPlayer.intercepts ?? 0,
  };
}

function toSnakeCase(frontendPlayer: PlayerData, authUserId: string) {
  return {
    auth_user_id: authUserId,
    full_name: frontendPlayer.fullName,
    username: frontendPlayer.username,
    avatar_url: frontendPlayer.avatar,
    position: frontendPlayer.position,
    secondary_position: frontendPlayer.secondaryPosition || null,
    strong_foot: frontendPlayer.strongFoot,
    play_style: frontendPlayer.playStyle,
    bio: frontendPlayer.bio || null,
    rating: frontendPlayer.rating,
    matches_played: frontendPlayer.matchesPlayed ?? 0,
    goals: frontendPlayer.goals ?? 0,
    assists: frontendPlayer.assists ?? 0,
    tackles: frontendPlayer.tackles ?? 0,
    saves: frontendPlayer.saves ?? 0,
    intercepts: frontendPlayer.intercepts ?? 0,
  };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerData, setPlayerData] = useState<PlayerData>(defaultPlayerData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBackendSynced, setIsBackendSynced] = useState(false);
  
  const { isSignedIn, getToken, user } = useStrykAuth();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stryk_player_data");
      if (stored) {
        const parsedPlayer = JSON.parse(stored);
        queueMicrotask(() => {
          setPlayerData(parsedPlayer);
        });
      }
    } catch (e) {
      console.error("Error loading player data from localStorage", e);
    }
    queueMicrotask(() => {
      setIsLoaded(true);
    });
  }, []);

  // Push local changes to the backend
  const pushToBackend = async (data: PlayerData, token: string) => {
    if (!user?.id) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    try {
      // Try to update current profile (PATCH)
      const patchResponse = await fetch(`${apiUrl}/api/v1/players/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: data.fullName,
          username: data.username,
          avatar_url: data.avatar,
          position: data.position,
          secondary_position: data.secondaryPosition || null,
          strong_foot: data.strongFoot,
          play_style: data.playStyle,
          bio: data.bio || null,
          rating: data.rating,
          matches_played: data.matchesPlayed ?? 0,
          goals: data.goals ?? 0,
          assists: data.assists ?? 0,
          tackles: data.tackles ?? 0,
          saves: data.saves ?? 0,
          intercepts: data.intercepts ?? 0,
        }),
      });

      if (patchResponse.ok) {
        setIsBackendSynced(true);
        return;
      }

      // If profile is not found (404), create it (POST)
      if (patchResponse.status === 404) {
        const postResponse = await fetch(`${apiUrl}/api/v1/players/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(toSnakeCase(data, user.id)),
        });

        if (postResponse.ok) {
          setIsBackendSynced(true);
        }
      }
    } catch (err) {
      console.error("Failed to push player data to backend:", err);
      setIsBackendSynced(false);
    }
  };

  // Sync from backend when authentication status changes
  useEffect(() => {
    async function syncFromBackend() {
      if (!isSignedIn) return;
      
      try {
        const token = await getToken();
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/v1/players/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const backendPlayer = await response.json();
          const camelPlayer = toCamelCase(backendPlayer);
          setPlayerData(camelPlayer);
          localStorage.setItem("stryk_player_data", JSON.stringify(camelPlayer));
          setIsBackendSynced(true);
        } else if (response.status === 404) {
          // Profile doesn't exist on backend yet. Push current local data if available.
          const stored = localStorage.getItem("stryk_player_data");
          if (stored) {
            const localData = JSON.parse(stored);
            await pushToBackend(localData, token);
          }
        }
      } catch (err) {
        console.error("Failed to sync player data from backend:", err);
        setIsBackendSynced(false);
      }
    }

    if (isSignedIn) {
      syncFromBackend();
    }
  }, [isSignedIn, user?.id]);

  const updatePlayerData = (data: Partial<PlayerData>) => {
    setPlayerData((prev) => {
      const updated = { ...prev, ...data };
      
      // Calculate OVR dynamically
      updated.rating = calculateOvr(updated);

      try {
        localStorage.setItem("stryk_player_data", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving player data to localStorage", e);
      }

      // Sync changes to backend in the background if signed in
      if (isSignedIn) {
        getToken().then((token) => {
          if (token) {
            pushToBackend(updated, token);
          }
        });
      }

      return updated;
    });
  };

  const resetPlayerData = () => {
    setPlayerData(defaultPlayerData);
    try {
      localStorage.removeItem("stryk_player_data");
    } catch (e) {
      console.error("Error removing player data", e);
    }
    setIsBackendSynced(false);
  };

  // Helper to generate football stats based on playstyle
  const getStats = () => {
    return calculateStats(playerData);
  };

  return (
    <PlayerContext.Provider
      value={{
        playerData,
        updatePlayerData,
        resetPlayerData,
        getStats,
        isLoaded,
        isBackendSynced,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
