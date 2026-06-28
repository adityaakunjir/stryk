"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useDraft } from "@/lib/draft-context";
import { FormationGrid } from "@/components/formation-grid";
import { TeamCard } from "@/components/team-card";
import { ChemistryBadge } from "@/components/chemistry-badge";
import { calculateAverageRating, calculateChemistry, calculateWinRate, isTeamBalanced } from "@/lib/team-utils";
import { createMatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertCircle, Zap } from "lucide-react";

function PreviewPageContent() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { state, calculateTeamStats } = useDraft();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.teamA.length || !state.teamB.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-xl text-gray-400 mb-4">No draft data available</p>
          <Button
            onClick={() => router.back()}
            className="bg-[#C6FF00] text-[#05070B] font-bold"
          >
            Back to Draft
          </Button>
        </motion.div>
      </div>
    );
  }

  const teamAStats = calculateTeamStats(state.teamA);
  const teamBStats = calculateTeamStats(state.teamB);
  const teamAChemistry = calculateChemistry(state.teamA);
  const teamBChemistry = calculateChemistry(state.teamB);
  const teamABalance = isTeamBalanced(state.teamA);
  const teamBBalance = isTeamBalanced(state.teamB);

  const ratingDiff = Math.abs(teamAStats.averageRating - teamBStats.averageRating);
  const isBalanced = ratingDiff <= 3;

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated");
        setIsConfirming(false);
        return;
      }

      // Create match with team data and positions
      const matchData = {
        title: state.matchSize,
        location: "Default Turf",
        date_time: new Date().toISOString(),
        max_players: state.maxPlayers,
        format: state.matchSize,
        teamA: state.teamA.map((p) => ({
          playerId: p.playerId,
          x: p.x,
          y: p.y,
        })),
        teamB: state.teamB.map((p) => ({
          playerId: p.playerId,
          x: p.x,
          y: p.y,
        })),
      };

      await createMatch(matchData, token);

      // Show success message and redirect
      setTimeout(() => {
        router.push("/lobbies");
      }, 1000);
    } catch (err) {
      console.error("Failed to create match:", err);
      setError(err instanceof Error ? err.message : "Failed to create match");
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-[#C6FF00]/20 bg-[#151515]/95 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
              <h1 className="text-2xl font-bold">Match Preview</h1>
              <p className="text-sm text-gray-400">{state.matchSize} • Review & Confirm</p>
            </div>
          </div>

          {/* Balance indicator */}
          {isBalanced ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/50 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-300">Balanced Match</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-400/50 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-300">{ratingDiff} Rating Gap</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <div className="w-full px-4 py-6 space-y-6">
        {/* Team comparison overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Team A stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-[#0B1020] border border-blue-400/30"
          >
            <h3 className="text-lg font-bold mb-4 text-blue-400">Team A</h3>
            <div className="space-y-4">
              {/* Overall rating comparison */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Overall Rating</span>
                  <span className="text-2xl font-bold text-blue-400">{teamAStats.averageRating}</span>
                </div>
                <div className="w-full bg-[#151515] rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(teamAStats.averageRating / 99) * 100}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  />
                </div>
              </div>

              {/* Chemistry */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Chemistry</span>
                <div className="flex items-center gap-2">
                  <ChemistryBadge score={teamAChemistry} size="md" showLabel={false} />
                  <span className="font-bold">{teamAChemistry}%</span>
                </div>
              </div>

              {/* Win rate */}
              {teamAStats.matches > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Team Win Rate</span>
                  <span className="font-bold text-green-400">{teamAStats.winRate}%</span>
                </div>
              )}

              {/* Player count by position */}
              <div className="text-xs text-gray-400 space-y-1">
                <p className="font-bold text-gray-300 mb-2">Positions:</p>
                {Object.entries(
                  state.teamA.reduce(
                    (acc, p) => {
                      const pos = p.playerData?.position || "ST";
                      acc[pos] = (acc[pos] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([pos, count]) => (
                  <div key={pos} className="flex justify-between">
                    <span>{pos}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Team B stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-[#0B1020] border border-red-400/30"
          >
            <h3 className="text-lg font-bold mb-4 text-red-400">Team B</h3>
            <div className="space-y-4">
              {/* Overall rating comparison */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Overall Rating</span>
                  <span className="text-2xl font-bold text-red-400">{teamBStats.averageRating}</span>
                </div>
                <div className="w-full bg-[#151515] rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(teamBStats.averageRating / 99) * 100}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-red-500 to-red-400"
                  />
                </div>
              </div>

              {/* Chemistry */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Chemistry</span>
                <div className="flex items-center gap-2">
                  <ChemistryBadge score={teamBChemistry} size="md" showLabel={false} />
                  <span className="font-bold">{teamBChemistry}%</span>
                </div>
              </div>

              {/* Win rate */}
              {teamBStats.matches > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Team Win Rate</span>
                  <span className="font-bold text-green-400">{teamBStats.winRate}%</span>
                </div>
              )}

              {/* Player count by position */}
              <div className="text-xs text-gray-400 space-y-1">
                <p className="font-bold text-gray-300 mb-2">Positions:</p>
                {Object.entries(
                  state.teamB.reduce(
                    (acc, p) => {
                      const pos = p.playerData?.position || "ST";
                      acc[pos] = (acc[pos] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([pos, count]) => (
                  <div key={pos} className="flex justify-between">
                    <span>{pos}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Formations stacked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Team A Formation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-lg bg-gradient-to-br from-[#0B1020] to-[#05070B] border border-blue-400/30"
          >
            <h3 className="text-base font-bold mb-3 text-blue-400">Team A Formation</h3>
            <FormationGrid
              maxPlayers={state.maxPlayers / 2}
              teamPlayers={state.teamA}
              onPlayerDrop={() => {}}
              onPlayerRemove={() => {}}
              readOnly={true}
              showZoneLabels={true}
            />
          </motion.div>

          {/* Team B Formation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-lg bg-gradient-to-br from-[#0B1020] to-[#05070B] border border-red-400/30"
          >
            <h3 className="text-base font-bold mb-3 text-red-400">Team B Formation</h3>
            <FormationGrid
              maxPlayers={state.maxPlayers / 2}
              teamPlayers={state.teamB}
              onPlayerDrop={() => {}}
              onPlayerRemove={() => {}}
              readOnly={true}
              showZoneLabels={true}
            />
          </motion.div>
        </motion.div>

        {/* Team Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <TeamCard
            teamName="Team A"
            teamPlayers={state.teamA.map((p) => p.playerData)}
            averageRating={teamAStats.averageRating}
            chemistryScore={teamAChemistry}
            wins={teamAStats.wins}
            totalMatches={teamAStats.matches}
            maxPlayers={state.maxPlayers / 2}
          />
          <TeamCard
            teamName="Team B"
            teamPlayers={state.teamB.map((p) => p.playerData)}
            averageRating={teamBStats.averageRating}
            chemistryScore={teamBChemistry}
            wins={teamBStats.wins}
            totalMatches={teamBStats.matches}
            maxPlayers={state.maxPlayers / 2}
          />
        </motion.div>

        {/* Action buttons */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 py-6 sticky bottom-0 bg-gradient-to-t from-[#05070B] to-transparent pt-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full py-3 bg-gradient-to-r from-[#C6FF00] to-[#5B8CFF] hover:from-[#C6FF00]/90 hover:to-[#5B8CFF]/90 text-[#05070B] font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-12 text-sm"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Creating Match...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Create Match
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.back()}
            disabled={isConfirming}
            className="w-full py-3 bg-[#0B1020] border border-[#C6FF00]/30 hover:border-[#C6FF00]/50 text-white font-bold rounded-lg transition-colors h-12 text-sm"
          >
            Adjust Teams
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#05070B] to-[#0B1020] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6FF00]" /></div>}>
      <PreviewPageContent />
    </Suspense>
  );
}
