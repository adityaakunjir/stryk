"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useStrykAuth } from "./auth-provider";

export type PlayStyleType = "Speedster" | "Playmaker" | "Poacher" | "Box-to-Box";

export interface PlayerData {
  fullName: string;
  username: string;
  avatar: string; // base64 or url
  position: string;
  secondaryPosition: string;
  strongFoot: "Left" | "Right";
  playStyle: PlayStyleType;
  bio: string;
  rating: number;
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
  full_name?: string;
  username?: string;
  avatar_url?: string;
  position?: string;
  secondary_position?: string;
  strong_foot?: string;
  play_style?: PlayStyleType;
  bio?: string;
  rating?: number;
};

const defaultPlayerData: PlayerData = {
  fullName: "Aditya Akunjir",
  username: "aditya10",
  avatar: "",
  position: "CAM",
  secondaryPosition: "",
  strongFoot: "Left",
  playStyle: "Playmaker",
  bio: "Creative playmaker looking to dominate the midfield and assist the attack.",
  rating: 82,
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function toCamelCase(backendPlayer: BackendPlayer): PlayerData {
  return {
    fullName: backendPlayer.full_name || "",
    username: backendPlayer.username || "",
    avatar: backendPlayer.avatar_url || "",
    position: backendPlayer.position || "CAM",
    secondaryPosition: backendPlayer.secondary_position || "",
    strongFoot: backendPlayer.strong_foot === "Left" ? "Left" : "Right",
    playStyle: backendPlayer.play_style || "Playmaker",
    bio: backendPlayer.bio || "",
    rating: backendPlayer.rating || 80,
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
      
      // Calculate rating based on playstyle and position
      let baseRating = 80;
      if (updated.playStyle === "Playmaker") baseRating = 82;
      else if (updated.playStyle === "Speedster") baseRating = 84;
      else if (updated.playStyle === "Poacher") baseRating = 83;
      else if (updated.playStyle === "Box-to-Box") baseRating = 81;

      updated.rating = baseRating;

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
    const style = playerData.playStyle;
    
    // Base stats
    let pac = 75;
    let sho = 70;
    let pas = 75;
    let dri = 75;
    let def = 50;
    let phy = 65;

    // Adjust based on position
    if (playerData.position === "ST") {
      sho += 10;
      pac += 5;
      def -= 10;
    } else if (playerData.position === "CB" || playerData.position === "LB" || playerData.position === "RB") {
      def += 25;
      phy += 15;
      sho -= 15;
      dri -= 5;
    } else if (playerData.position === "GK") {
      def += 30;
      phy += 10;
      sho -= 30;
      pac -= 10;
    }

    // Adjust based on PlayStyle
    switch (style) {
      case "Speedster":
        pac += 15;
        dri += 8;
        def -= 5;
        break;
      case "Playmaker":
        pas += 14;
        dri += 10;
        sho += 4;
        break;
      case "Poacher":
        sho += 16;
        pac += 6;
        pas -= 5;
        def -= 8;
        break;
      case "Box-to-Box":
        phy += 12;
        def += 10;
        pas += 5;
        pac += 3;
        break;
    }

    // Keep values in normal football bounds (e.g. 30 to 99)
    const clamp = (val: number) => Math.min(99, Math.max(30, val));

    return [
      { label: "PAC", value: clamp(pac) },
      { label: "SHO", value: clamp(sho) },
      { label: "PAS", value: clamp(pas) },
      { label: "DRI", value: clamp(dri) },
      { label: "DEF", value: clamp(def) },
      { label: "PHY", value: clamp(phy) },
    ];
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
