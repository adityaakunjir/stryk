"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface PlayerPosition {
  playerId: string;
  x: number;
  y: number;
  playerData?: any;
}

export interface DraftState {
  maxPlayers: number;
  matchSize: string;
  teamA: PlayerPosition[];
  teamB: PlayerPosition[];
  availablePlayers: any[];
  currentTurn: "teamA" | "teamB";
  isComplete: boolean;
}

interface DraftContextType {
  state: DraftState;
  pickPlayer: (playerId: string, team: "teamA" | "teamB", playerData: any) => void;
  unpickPlayer: (playerId: string, team: "teamA" | "teamB") => void;
  updatePlayerPosition: (playerId: string, team: "teamA" | "teamB", x: number, y: number) => void;
  switchTurn: () => void;
  initializeDraft: (maxPlayers: number, availablePlayers: any[]) => void;
  resetDraft: () => void;
  setAvailablePlayers: (players: any[]) => void;
  calculateTeamStats: (team: PlayerPosition[]) => any;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DraftState>({
    maxPlayers: 22,
    matchSize: "11v11",
    teamA: [],
    teamB: [],
    availablePlayers: [],
    currentTurn: "teamA",
    isComplete: false,
  });

  const initializeDraft = useCallback((maxPlayers: number, availablePlayers: any[]) => {
    const matchSizeLabel = `${maxPlayers / 2}v${maxPlayers / 2}`;
    setState((prev) => ({
      ...prev,
      maxPlayers,
      matchSize: matchSizeLabel,
      availablePlayers,
      teamA: [],
      teamB: [],
      currentTurn: "teamA",
      isComplete: false,
    }));
  }, []);

  const pickPlayer = useCallback((playerId: string, team: "teamA" | "teamB", playerData: any) => {
    setState((prev) => {
      // Check if player is already picked
      if (prev.teamA.some((p) => p.playerId === playerId) || prev.teamB.some((p) => p.playerId === playerId)) {
        return prev;
      }

      // Check if team is full
      const targetTeam = team === "teamA" ? prev.teamA : prev.teamB;
      if (targetTeam.length >= prev.maxPlayers / 2) {
        return prev;
      }

      const newPlayer: PlayerPosition = {
        playerId,
        x: 50,
        y: team === "teamA" ? 50 : 50, // Center of pitch by default
        playerData,
      };

      const newTeamA = team === "teamA" ? [...prev.teamA, newPlayer] : prev.teamA;
      const newTeamB = team === "teamB" ? [...prev.teamB, newPlayer] : prev.teamB;

      const isComplete = newTeamA.length === prev.maxPlayers / 2 && newTeamB.length === prev.maxPlayers / 2;

      return {
        ...prev,
        teamA: newTeamA,
        teamB: newTeamB,
        isComplete,
      };
    });
  }, []);

  const unpickPlayer = useCallback((playerId: string, team: "teamA" | "teamB") => {
    setState((prev) => {
      const newTeamA = team === "teamA" ? prev.teamA.filter((p) => p.playerId !== playerId) : prev.teamA;
      const newTeamB = team === "teamB" ? prev.teamB.filter((p) => p.playerId !== playerId) : prev.teamB;

      return {
        ...prev,
        teamA: newTeamA,
        teamB: newTeamB,
        isComplete: false,
      };
    });
  }, []);

  const updatePlayerPosition = useCallback((playerId: string, team: "teamA" | "teamB", x: number, y: number) => {
    setState((prev) => {
      const updateTeam = (players: PlayerPosition[]) =>
        players.map((p) => (p.playerId === playerId ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p));

      return {
        ...prev,
        teamA: team === "teamA" ? updateTeam(prev.teamA) : prev.teamA,
        teamB: team === "teamB" ? updateTeam(prev.teamB) : prev.teamB,
      };
    });
  }, []);

  const switchTurn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTurn: prev.currentTurn === "teamA" ? "teamB" : "teamA",
    }));
  }, []);

  const resetDraft = useCallback(() => {
    setState({
      maxPlayers: 22,
      matchSize: "11v11",
      teamA: [],
      teamB: [],
      availablePlayers: [],
      currentTurn: "teamA",
      isComplete: false,
    });
  }, []);

  const setAvailablePlayers = useCallback((players: any[]) => {
    setState((prev) => ({
      ...prev,
      availablePlayers: players,
    }));
  }, []);

  const calculateTeamStats = useCallback((team: PlayerPosition[]) => {
    if (team.length === 0) {
      return { averageRating: 0, totalXP: 0, wins: 0, matches: 0 };
    }

    const stats = team.reduce(
      (acc, pos) => {
        const player = pos.playerData;
        const rating = player?.overall || player?.rating || 70;
        const xp = player?.xp || 0;
        const wins = player?.wins || 0;
        const matches = player?.matches || 0;

        return {
          totalRating: acc.totalRating + rating,
          totalXP: acc.totalXP + xp,
          totalWins: acc.totalWins + wins,
          totalMatches: acc.totalMatches + matches,
        };
      },
      { totalRating: 0, totalXP: 0, totalWins: 0, totalMatches: 0 }
    );

    return {
      averageRating: Math.round(stats.totalRating / team.length),
      totalXP: stats.totalXP,
      wins: stats.totalWins,
      matches: stats.totalMatches,
      winRate: stats.totalMatches > 0 ? Math.round((stats.totalWins / stats.totalMatches) * 100) : 0,
    };
  }, []);

  const value: DraftContextType = {
    state,
    pickPlayer,
    unpickPlayer,
    updatePlayerPosition,
    switchTurn,
    initializeDraft,
    resetDraft,
    setAvailablePlayers,
    calculateTeamStats,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error("useDraft must be used within a DraftProvider");
  }
  return context;
}
