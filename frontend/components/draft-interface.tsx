"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Users, Filter, Search } from "lucide-react";
import { useState } from "react";
import { FIFAPlayerCard } from "./fifa-player-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface DraftInterfaceProps {
  matchSize: string; // e.g., "5v5", "11v11"
  maxPlayers: number;
  availablePlayers: any[];
  selectedTeamCount: number;
  onSelectPlayer: (playerId: string) => void;
  currentTurn?: "teamA" | "teamB";
  isLoading?: boolean;
  positionFilter?: string;
  onPositionFilterChange?: (position: string) => void;
  onSortChange?: (sortBy: "rating" | "position" | "recent") => void;
}

export function DraftInterface({
  matchSize,
  maxPlayers,
  availablePlayers,
  selectedTeamCount,
  onSelectPlayer,
  currentTurn = "teamA",
  isLoading = false,
  positionFilter,
  onPositionFilterChange,
  onSortChange,
}: DraftInterfaceProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "position" | "recent">("rating");
  const [searchQuery, setSearchQuery] = useState("");

  const playersRemaining = maxPlayers - selectedTeamCount;
  const isTeamFull = playersRemaining <= 0;

  // Filter and sort players
  let filteredPlayers = availablePlayers;

  if (searchQuery) {
    filteredPlayers = filteredPlayers.filter(
      (p) =>
        p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (positionFilter && positionFilter !== "all") {
    filteredPlayers = filteredPlayers.filter(
      (p) => p.position?.toUpperCase() === positionFilter.toUpperCase()
    );
  }

  // Sort players
  filteredPlayers = filteredPlayers.sort((a, b) => {
    if (sortBy === "rating") {
      return (b.overall || b.rating || 70) - (a.overall || a.rating || 70);
    } else if (sortBy === "position") {
      return (a.position || "").localeCompare(b.position || "");
    }
    return 0;
  });

  const positions = Array.from(new Set(availablePlayers.map((p) => p.position).filter(Boolean)));

  const handlePlayerClick = (playerId: string) => {
    if (!isTeamFull && !isLoading) {
      onSelectPlayer(playerId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Header with match size and progress */}
      <div className="bg-gradient-to-r from-[#0B1020] to-[#05070B] rounded-xl p-6 border border-[#C6FF00]/30 shadow-lg">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-[#C6FF00]" />
              Draft Mode - {matchSize}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {currentTurn === "teamA" ? "Team A's" : "Team B's"} turn to pick
            </p>
          </div>

          {/* Progress indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-right"
          >
            <div className="text-4xl font-bold text-[#C6FF00]">
              {selectedTeamCount}/{maxPlayers}
            </div>
            <p className="text-sm text-gray-400">Players Selected</p>
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full glass-panel rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(selectedTeamCount / maxPlayers) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-[#C6FF00] to-[#5B8CFF]"
          />
        </div>

        {/* Status message */}
        <AnimatePresence>
          {isTeamFull && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-green-500/20 border border-green-400/50 rounded-lg text-green-300 text-sm font-semibold"
            >
              ✓ Team is complete! Ready to preview and confirm.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters and search */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0B1020] border-[#C6FF00]/30 text-white placeholder-gray-400"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 rounded-lg bg-[#0B1020] border border-[#C6FF00]/30 hover:border-[#C6FF00]/50 transition-colors"
          >
            <Filter className="w-4 h-4 text-[#C6FF00]" />
          </motion.button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[#0B1020] rounded-lg border border-[#C6FF00]/20 space-y-3">
                {/* Position filter */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Position</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPositionFilterChange?.("all")}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        positionFilter === "all"
                          ? "bg-[#C6FF00] text-[#05070B]"
                          : "glass-panel border border-[#C6FF00]/30 text-[#C6FF00] hover:border-[#C6FF00]/50"
                      }`}
                    >
                      All
                    </motion.button>
                    {positions.map((pos) => (
                      <motion.button
                        key={pos}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPositionFilterChange?.(pos || "")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          positionFilter === pos
                            ? "bg-[#C6FF00] text-[#05070B]"
                            : "glass-panel border border-[#C6FF00]/30 text-[#C6FF00] hover:border-[#C6FF00]/50"
                        }`}
                      >
                        {pos}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Sort options */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Sort By</label>
                  <div className="flex gap-2 mt-2">
                    {(["rating", "position", "recent"] as const).map((option) => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSortBy(option);
                          onSortChange?.(option);
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors capitalize ${
                          sortBy === option
                            ? "bg-[#C6FF00] text-[#05070B]"
                            : "glass-panel border border-[#C6FF00]/30 text-[#C6FF00] hover:border-[#C6FF00]/50"
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Available players grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#C6FF00]" />
          Available Players ({filteredPlayers.length})
        </h3>

        {filteredPlayers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400">No players match your criteria</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            <AnimatePresence>
              {filteredPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => handlePlayerClick(player.id)}
                  className={`cursor-pointer transform transition-transform ${
                    isTeamFull ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                  }`}
                  whileHover={!isTeamFull && !isLoading ? { scale: 1.05 } : {}}
                >
                  <FIFAPlayerCard player={player} size="md" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6FF00]" />
        </motion.div>
      )}
    </motion.div>
  );
}
