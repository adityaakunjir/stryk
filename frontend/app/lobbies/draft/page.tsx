"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { FormationGrid, PlayerPosition } from "@/components/formation-grid";
import { DraftInterface } from "@/components/draft-interface";
import { TeamCard } from "@/components/team-card";
import { useDraft } from "@/lib/draft-context";
import { calculateAverageRating, calculateChemistry, calculateWinRate } from "@/lib/team-utils";
import { getAvailablePlayers, AvailablePlayer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";

function DraftPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { state, pickPlayer, unpickPlayer, updatePlayerPosition, initializeDraft, calculateTeamStats } = useDraft();

  const maxPlayersParam = searchParams.get("maxPlayers");
  const maxPlayers = maxPlayersParam ? parseInt(maxPlayersParam) : 10; // Default to 5v5

  const [selectedTeam, setSelectedTeam] = useState<"teamA" | "teamB">("teamA");
  const [positionFilter, setPositionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch available players on mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token) {
          setError("Not authenticated");
          return;
        }
        const players = await getAvailablePlayers(token);
        setAvailablePlayers(players);
        
        // Initialize draft with fetched players
        // Transform AvailablePlayer to match the expected format
        const transformedPlayers = players.map((p) => ({
          id: p.playerId,
          username: p.username,
          overall: p.overall,
          rating: p.rating,
          position: p.position,
          playStyle: p.playStyle,
          level: p.level,
          xp: p.xp,
          wins: p.wins,
          matches: p.matches,
          strongFoot: p.strongFoot,
          avatarUrl: p.avatarUrl,
        }));
        
        initializeDraft(maxPlayers, transformedPlayers);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        setError(err instanceof Error ? err.message : "Failed to load players");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [getToken, maxPlayers, initializeDraft]);

  const handleSelectPlayer = (playerId: string) => {
    const player = availablePlayers.find((p) => p.playerId === playerId);
    if (player) {
      pickPlayer(playerId, selectedTeam, {
        id: playerId,
        username: player.username,
        overall: player.overall,
        rating: player.rating,
        position: player.position,
        playStyle: player.playStyle,
        level: player.level,
        xp: player.xp,
        wins: player.wins,
        matches: player.matches,
        strongFoot: player.strongFoot,
        avatarUrl: player.avatarUrl,
      });
    }
  };

  const handlePlayerDrop = (playerId: string, x: number, y: number) => {
    updatePlayerPosition(playerId, selectedTeam, x, y);
  };

  const handlePlayerRemove = (playerId: string) => {
    unpickPlayer(playerId, selectedTeam);
  };

  const handlePreview = () => {
    router.push("/lobbies/preview");
  };

  const teamAStats = calculateTeamStats(state.teamA);
  const teamBStats = calculateTeamStats(state.teamB);
  const teamAChemistry = calculateChemistry(state.teamA);
  const teamBChemistry = calculateChemistry(state.teamB);

  const teamsReady = state.teamA.length === maxPlayers / 2 && state.teamB.length === maxPlayers / 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6FF00] mx-auto mb-4" />
          <p className="text-gray-300">Loading available players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => router.back()}
            className="bg-[#C6FF00] text-[#05070B] font-bold"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-[#C6FF00]/20 bg-[#151515]/95 backdrop-blur-sm"
      >
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-2 hover:bg-[#0B1020] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold">Draft Mode</h1>
              <p className="text-sm text-gray-400">{state.matchSize} Match</p>
            </div>
          </div>

          {/* Team tabs */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTeam("teamA")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                selectedTeam === "teamA"
                  ? "bg-[#C6FF00] text-[#05070B]"
                  : "bg-[#0B1020] border border-[#C6FF00]/30 text-[#C6FF00] hover:border-[#C6FF00]/50"
              }`}
            >
              Team A ({state.teamA.length}/{maxPlayers / 2})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTeam("teamB")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                selectedTeam === "teamB"
                  ? "bg-[#C6FF00] text-[#05070B]"
                  : "bg-[#0B1020] border border-[#C6FF00]/30 text-[#C6FF00] hover:border-[#C6FF00]/50"
              }`}
            >
              Team B ({state.teamB.length}/{maxPlayers / 2})
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="w-full px-4 py-6 space-y-6">
        {/* Formation Grid - Full width */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-br from-[#0B1020] to-[#05070B] rounded-lg p-4 border border-[#C6FF00]/20">
            <FormationGrid
              maxPlayers={maxPlayers / 2}
              teamPlayers={selectedTeam === "teamA" ? state.teamA : state.teamB}
              onPlayerDrop={handlePlayerDrop}
              onPlayerRemove={handlePlayerRemove}
              showZoneLabels={true}
            />
          </div>
        </motion.div>

        {/* Team Card + Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Team Stats Card */}
          <TeamCard
            teamName={selectedTeam === "teamA" ? "Team A" : "Team B"}
            teamPlayers={(selectedTeam === "teamA" ? state.teamA : state.teamB).map((p) => p.playerData) || []}
            averageRating={selectedTeam === "teamA" ? teamAStats.averageRating : teamBStats.averageRating}
            chemistryScore={selectedTeam === "teamA" ? teamAChemistry : teamBChemistry}
            wins={selectedTeam === "teamA" ? teamAStats.wins : teamBStats.wins}
            totalMatches={selectedTeam === "teamA" ? teamAStats.matches : teamBStats.matches}
            maxPlayers={maxPlayers / 2}
          />

          {/* Both teams summary (only show when both are near complete) */}
          {state.teamA.length > 0 && state.teamB.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-gradient-to-br from-[#0B1020] to-[#05070B] border border-[#C6FF00]/20"
            >
              <h4 className="text-sm font-bold text-[#C6FF00] mb-3">Teams Overview</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Team A Avg Rating</span>
                  <span className="text-white font-bold">{teamAStats.averageRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team B Avg Rating</span>
                  <span className="text-white font-bold">{teamBStats.averageRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rating Difference</span>
                  <span className={`font-bold ${Math.abs(teamAStats.averageRating - teamBStats.averageRating) < 3 ? "text-green-400" : "text-yellow-400"}`}>
                    {Math.abs(teamAStats.averageRating - teamBStats.averageRating)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handlePreview}
              disabled={!teamsReady || isLoading}
              className="w-full bg-gradient-to-r from-[#C6FF00] to-[#5B8CFF] hover:from-[#C6FF00]/90 hover:to-[#5B8CFF]/90 text-[#05070B] font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <>
                  Preview & Confirm <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>

          {!teamsReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2.5 bg-yellow-500/20 border border-yellow-400/50 rounded-lg text-xs text-yellow-300"
            >
              Both teams must be complete ({maxPlayers / 2} players each) to proceed.
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Draft Interface (below) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full px-4 pb-8"
      >
        <DraftInterface
          matchSize={state.matchSize}
          maxPlayers={maxPlayers / 2}
          availablePlayers={availablePlayers.map((p) => ({
            id: p.playerId,
            username: p.username,
            overall: p.overall,
            rating: p.rating,
            position: p.position,
            playStyle: p.playStyle,
            level: p.level,
            xp: p.xp,
            wins: p.wins,
            matches: p.matches,
            strongFoot: p.strongFoot,
            avatarUrl: p.avatarUrl,
          }))}
          selectedTeamCount={selectedTeam === "teamA" ? state.teamA.length : state.teamB.length}
          onSelectPlayer={handleSelectPlayer}
          positionFilter={positionFilter}
          onPositionFilterChange={setPositionFilter}
        />
      </motion.div>
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6FF00]" /></div>}>
      <DraftPageContent />
    </Suspense>
  );
}
