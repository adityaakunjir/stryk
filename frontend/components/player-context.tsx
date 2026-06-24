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
  wins?: number;
  losses?: number;
  draws?: number;
  goals?: number;
  assists?: number;
  tackles?: number;
  saves?: number;
  intercepts?: number;
}

interface PlayerContextType {
  playerData: PlayerData;
  updatePlayerData: (data: Partial<PlayerData>) => Promise<void>;
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
  wins?: number;
  losses?: number;
  draws?: number;
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
  bio: "",
  rating: 60,
  matchesPlayed: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals: 0,
  assists: 0,
  tackles: 0,
  saves: 0,
  intercepts: 0};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

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
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`},
        body: JSON.stringify(data)});
      if (res.ok) {
        setIsBackendSynced(true);
      }
    } catch (err) {
      console.error("Failed to push data to backend", err);
    }
  };

  // Sync from backend when authentication status changes
  useEffect(() => {
    async function syncFromBackend() {
      if (!isSignedIn) return;
      try {
        const response = await fetch("/api/profile/me");
        if (response.ok) {
          const result = await response.json();
          const backendUser = result.data || result;
          
          if (backendUser && backendUser.id) {
            setPlayerData((prev) => {
              const updated = {
                ...prev,
                fullName: backendUser.fullName || backendUser.full_name || "",
                username: backendUser.username || "",
                avatar: backendUser.avatarUrl || backendUser.avatar_url || "",
                position: backendUser.position || "CAM",
                playStyle: backendUser.playStyle || backendUser.play_style || "Playmaker",
                matchesPlayed: backendUser.matchesPlayed ?? backendUser.matches_played ?? 0,
                wins: backendUser.wins ?? 0,
                losses: backendUser.losses ?? 0,
                draws: backendUser.draws ?? 0,
                goals: backendUser.goals ?? 0,
                assists: backendUser.assists ?? 0,
                tackles: backendUser.tackles ?? 0,
                saves: backendUser.saves ?? 0,
                intercepts: backendUser.intercepts ?? 0
              };
              updated.rating = calculateOvr(updated);
              localStorage.setItem("stryk_player_data", JSON.stringify(updated));
              return updated;
            });
            setIsBackendSynced(true);
          }
        } else if (response.status === 404) {
          // New User Flow: User is logged into Clerk, but has no STRYK profile
          // Clear any stale local data from previous users!
          resetPlayerData();
          
          // Prevent redirect loops if they are already on an onboarding page
          const currentPath = window.location.pathname;
          const isOnboarding = ['/identity', '/position', '/play-style'].includes(currentPath);
          if (!isOnboarding) {
            window.location.href = "/identity";
          }
        }
      } catch (err) { console.error("Failed to sync from /api/profile/me:", err);
      }
    }

    if (isSignedIn) {
      syncFromBackend();
    }
  }, [isSignedIn, user?.id]);

  const updatePlayerData = async (data: Partial<PlayerData>) => {
    let finalUpdated: PlayerData | undefined;

    setPlayerData((prev) => {
      const updated = { ...prev, ...data };
      
      // Calculate OVR dynamically
      updated.rating = calculateOvr(updated);

      try {
        localStorage.setItem("stryk_player_data", JSON.stringify(updated));
      } catch (e) { console.error("Error saving player data to localStorage", e);
      }

      finalUpdated = updated;
      return updated;
    });

    // Sync changes to backend if signed in
    if (isSignedIn && finalUpdated) {
      const token = await getToken();
      if (token) {
        await pushToBackend(finalUpdated, token);
      }
    }
  };

  const resetPlayerData = () => {
    setPlayerData(defaultPlayerData);
    try {
      localStorage.removeItem("stryk_player_data");
    } catch (e) { console.error("Error removing player data", e);
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
        isBackendSynced}}
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
