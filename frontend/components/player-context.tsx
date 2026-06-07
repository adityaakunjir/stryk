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
    // Backend API is not active yet. Defaulting to local storage sync.
    setIsBackendSynced(true);
  };

  // Sync from backend when authentication status changes
  useEffect(() => {
    async function syncFromBackend() {
      if (!isSignedIn) return;
      try {
        const response = await fetch("/api/profile/me");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const backendUser = result.data;
            setPlayerData((prev) => {
              const updated = {
                ...prev,
                fullName: backendUser.fullName || prev.fullName,
                username: backendUser.username || prev.username,
                avatar: backendUser.avatarUrl || prev.avatar,
                position: backendUser.position || prev.position,
                playStyle: backendUser.playStyle || prev.playStyle,
              };
              updated.rating = calculateOvr(updated);
              localStorage.setItem("stryk_player_data", JSON.stringify(updated));
              return updated;
            });
            setIsBackendSynced(true);
          }
        }
      } catch (err) {
        console.error("Failed to sync from /api/profile/me:", err);
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
