"use client";

import { motion } from "framer-motion";
import { Zap, AlertCircle, CheckCircle } from "lucide-react";

export type ChemistryLevel = "excellent" | "good" | "neutral" | "poor";

export interface ChemistryBadgeProps {
  score: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

export function ChemistryBadge({ score, showLabel = true, size = "md", tooltip }: ChemistryBadgeProps) {
  const getChemistryLevel = (s: number): ChemistryLevel => {
    if (s >= 80) return "excellent";
    if (s >= 60) return "good";
    if (s >= 40) return "neutral";
    return "poor";
  };

  const getColors = (level: ChemistryLevel) => {
    switch (level) {
      case "excellent":
        return { bg: "bg-green-500", border: "border-green-400", icon: "text-green-300", text: "text-green-300" };
      case "good":
        return { bg: "bg-blue-500", border: "border-blue-400", icon: "text-blue-300", text: "text-blue-300" };
      case "neutral":
        return { bg: "bg-yellow-500", border: "border-yellow-400", icon: "text-yellow-300", text: "text-yellow-300" };
      case "poor":
        return { bg: "bg-red-500", border: "border-red-400", icon: "text-red-300", text: "text-red-300" };
    }
  };

  const getLabel = (level: ChemistryLevel): string => {
    switch (level) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "neutral":
        return "Neutral";
      case "poor":
        return "Poor";
    }
  };

  const level = getChemistryLevel(score);
  const colors = getColors(level);

  const sizeConfig = {
    sm: { badge: "w-6 h-6", text: "text-xs", iconSize: 3 },
    md: { badge: "w-8 h-8", text: "text-sm", iconSize: 4 },
    lg: { badge: "w-10 h-10", text: "text-base", iconSize: 5 },
  };

  const config = sizeConfig[size];
  const Icon = level === "excellent" ? CheckCircle : level === "poor" ? AlertCircle : Zap;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className="relative group"
      title={tooltip}
    >
      <div className={`${config.badge} rounded-full border-2 ${colors.border} ${colors.bg}/20 flex items-center justify-center backdrop-blur-sm`}>
        <Icon className={`w-${config.iconSize} h-${config.iconSize} ${colors.icon}`} />
      </div>

      {/* Tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#151515] text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none z-50 border border-[#C6FF00]/30"
      >
        <div className="font-bold">{getLabel(level)}</div>
        <div className={colors.text}>{score}% compatibility</div>
      </motion.div>

      {/* Label below badge */}
      {showLabel && (
        <div className={`mt-1 text-center ${colors.text} font-semibold ${config.text}`}>{getLabel(level)}</div>
      )}
    </motion.div>
  );
}
