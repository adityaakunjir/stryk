"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useStrykAuth } from "./auth-provider";
import { calculateStats } from "@/lib/stat-utils";

// Bump this version key whenever the data shape changes.
// Old caches with different versions are automatically discarded on load.
const CACHE_KEY = "stryk_player_v5";

export type PlayStyleType = "Speedster" | "Playmaker" | "Poacher" | "Box-to-Box";

export interface PlayerData {
  id?: number;
  fullName: string;
  username: string;
  avatar: string;
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
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  gkDiving?: number;
  gkHandling?: number;
  gkKicking?: number;
  gkReflexes?: number;
  gkPositioning?: number;
}

interface PlayerContextType {
  playerData: PlayerData;
  updatePlayerData: (data: Partial<PlayerData>) => Promise<void>;
  resetPlayerData: () => void;
  getStats: () => { label: string; value: number }[];
  isLoaded: boolean;
  isBackendSynced: boolean;
}

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
  intercepts: 0,
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

/** Read cache from localStorage — returns null on any error or version mismatch */
function readCache(): PlayerData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerData;
  } catch {
    return null;
  }
}

/** Write to localStorage — silent on error */
function writeCache(data: PlayerData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

/** Merge backend user payload into a PlayerData shape */
function mergeBackendUser(prev: PlayerData, backendUser: Record<string, unknown>): PlayerData {
  const updated: PlayerData = {
    ...prev,
    fullName: (backendUser.fullName as string) || (backendUser.full_name as string) || prev.fullName || "",
    username: (backendUser.username as string) || prev.username || "",
    avatar: (backendUser.avatarUrl as string) || (backendUser.avatar_url as string) || prev.avatar || "",
    position: (backendUser.position as string) || prev.position || "CAM",
    playStyle: ((backendUser.playStyle || backendUser.play_style) as PlayStyleType) || prev.playStyle || "Playmaker",
    matchesPlayed: (backendUser.matchesPlayed as number) ?? (backendUser.matches_played as number) ?? prev.matchesPlayed ?? 0,
    wins: (backendUser.wins as number) ?? prev.wins ?? 0,
    losses: (backendUser.losses as number) ?? prev.losses ?? 0,
    draws: (backendUser.draws as number) ?? prev.draws ?? 0,
    goals: (backendUser.goals as number) ?? prev.goals ?? 0,
    assists: (backendUser.assists as number) ?? prev.assists ?? 0,
    tackles: (backendUser.tackles as number) ?? prev.tackles ?? 0,
    saves: (backendUser.saves as number) ?? prev.saves ?? 0,
    intercepts: (backendUser.intercepts as number) ?? prev.intercepts ?? 0,
    // Always use exact backend stat values — they are the source of truth
    pace: backendUser.pace as number,
    shooting: backendUser.shooting as number,
    passing: backendUser.passing as number,
    dribbling: backendUser.dribbling as number,
    defending: backendUser.defending as number,
    physical: backendUser.physical as number,
    gkDiving: backendUser.gkDiving as number,
    gkHandling: backendUser.gkHandling as number,
    gkKicking: backendUser.gkKicking as number,
    gkReflexes: backendUser.gkReflexes as number,
    gkPositioning: backendUser.gkPositioning as number,
  };
  updated.rating = (backendUser.OVR as number) ?? (backendUser.overall as number) ?? (backendUser.rating as number) ?? 60;
  return updated;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Initialise state synchronously from cache so the first render shows real data
  const [playerData, setPlayerData] = useState<PlayerData>(() => readCache() ?? defaultPlayerData);
  const [isLoaded, setIsLoaded] = useState(() => readCache() !== null);
  const [isBackendSynced, setIsBackendSynced] = useState(false);

  const { isSignedIn, getToken, user } = useStrykAuth();

  const resetPlayerData = useCallback(() => {
    setPlayerData(defaultPlayerData);
    try {
      localStorage.removeItem(CACHE_KEY);
      // Also clear old key versions to avoid accumulation
      localStorage.removeItem("stryk_player_data");
    } catch {}
    setIsBackendSynced(false);
  }, []);

  // Mark as loaded on mount (in case we had no cache)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Sync from backend whenever auth state changes
  useEffect(() => {
    if (!isSignedIn) return;

    async function syncFromBackend() {
      try {
        const response = await fetch("/api/profile/me", { cache: "no-store" });

        if (response.ok) {
          const result = await response.json();
          const backendUser = (result.data || result) as Record<string, unknown>;

          if (backendUser?.id) {
            setPlayerData((prev) => {
              const updated = mergeBackendUser(prev, backendUser);
              writeCache(updated);
              return updated;
            });
            setIsBackendSynced(true);
          }
        } else if (response.status === 404) {
          resetPlayerData();
          const currentPath = window.location.pathname;
          const isOnboarding = ["/identity", "/position", "/play-style"].includes(currentPath);
          if (!isOnboarding) {
            window.location.href = "/identity";
          }
        }
      } catch (err) {
        console.error("Failed to sync from /api/profile/me:", err);
      }
    }

    syncFromBackend();
  }, [isSignedIn, user?.id, resetPlayerData]);

  // Push local changes to the backend and immediately apply returned stats
  const pushToBackend = async (data: PlayerData, token: string) => {
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, overall: data.rating }),
      });
      if (res.ok) {
        setIsBackendSynced(true);
        const result = await res.json();
        const backendUser = (result.data || result) as Record<string, unknown>;
        if (backendUser?.pace !== undefined) {
          setPlayerData((prev) => {
            const updated = mergeBackendUser(prev, backendUser);
            writeCache(updated);
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("Failed to push data to backend", err);
    }
  };

  const updatePlayerData = async (data: Partial<PlayerData>) => {
    let finalUpdated: PlayerData | undefined;

    setPlayerData((prev) => {
      const updated = { ...prev, ...data };
      updated.rating = data.rating ?? prev.rating ?? 60;
      writeCache(updated);
      finalUpdated = updated;
      return updated;
    });

    if (isSignedIn && finalUpdated) {
      const token = await getToken();
      if (token) await pushToBackend(finalUpdated, token);
    }
  };

  const getStats = () => calculateStats(playerData);

  return (
    <PlayerContext.Provider
      value={{ playerData, updatePlayerData, resetPlayerData, getStats, isLoaded, isBackendSynced }}
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
