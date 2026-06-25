"use client";

import { motion } from "framer-motion";
import { Trophy, Zap, Users } from "lucide-react";
import Image from "next/image";

export interface TeamCardProps {
  teamName: string;
  teamPlayers: any[];
  averageRating?: number;
  chemistryScore?: number;
  wins?: number;
  totalMatches?: number;
  maxPlayers: number;
}

export function TeamCard({
  teamName,
  teamPlayers,
  averageRating = 75,
  chemistryScore = 85,
  wins = 0,
  totalMatches = 0,
  maxPlayers,
}: TeamCardProps) {
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Get top 5 players by rating
  const topPlayers = teamPlayers
    .sort((a, b) => (b.overall || b.rating || 70) - (a.overall || a.rating || 70))
    .slice(0, 5);

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return "from-yellow-400 to-yellow-600";
    if (rating >= 80) return "from-blue-400 to-blue-600";
    if (rating >= 75) return "from-green-400 to-green-600";
    if (rating >= 70) return "from-purple-400 to-purple-600";
    return "from-gray-400 to-gray-600";
  };

  const chemistryColor = chemistryScore >= 80 ? "text-green-400" : chemistryScore >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm rounded-2xl overflow-hidden bg-gradient-to-br from-[#0B1020] to-[#05070B] border border-[#C6FF00]/30 shadow-2xl"
    >
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-[#C6FF00]/20 to-[#5B8CFF]/20 border-b border-[#C6FF00]/20">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {teamName}
        </motion.h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-[#C6FF00]">
            <Users className="w-4 h-4" />
            <span>{teamPlayers.length}/{maxPlayers}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-4">
        {/* Average Rating */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <span className="text-gray-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#C6FF00]" />
            Avg Rating
          </span>
          <div className={`text-2xl font-bold bg-gradient-to-r ${getRatingColor(averageRating)} bg-clip-text text-transparent`}>
            {Math.round(averageRating)}
          </div>
        </motion.div>

        {/* Chemistry Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <span className="text-gray-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Chemistry
          </span>
          <span className={`text-xl font-bold ${chemistryColor}`}>{chemistryScore}%</span>
        </motion.div>

        {/* Win Rate */}
        {totalMatches > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <span className="text-gray-300">Win Rate</span>
            <span className="text-xl font-bold text-green-400">{winRate}%</span>
          </motion.div>
        )}
      </div>

      {/* Top Players */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-bold text-[#C6FF00] mb-3">Top Players</h4>
        <div className="space-y-2">
          {topPlayers.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="flex items-center justify-between p-2 rounded-lg bg-[#05070B]/50 border border-[#C6FF00]/20 hover:border-[#C6FF00]/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {player.avatar || player.avatarUrl ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={player.avatar || player.avatarUrl}
                      alt={player.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                    {player.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{player.username}</p>
                  <p className="text-xs text-gray-400">{player.position || "?"}</p>
                </div>
              </div>
              <div
                className={`text-sm font-bold bg-gradient-to-r ${getRatingColor(player.overall || player.rating || 70)} bg-clip-text text-transparent flex-shrink-0`}
              >
                {Math.round(player.overall || player.rating || 70)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
