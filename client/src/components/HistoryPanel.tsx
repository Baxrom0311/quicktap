/*
 * DESIGN: Brutalist Speed Machine
 * - Sharp borders, no rounded corners
 * - Diagonal stripe accents
 * - Condensed data display with difficulty badges
 */

import { motion } from "framer-motion";
import { Trash2, Trophy, TrendingUp } from "lucide-react";
import type { GameAttempt, Difficulty, DifficultyConfig } from "@/hooks/useGameState";
import { DIFFICULTY_CONFIGS } from "@/hooks/useGameState";

interface HistoryPanelProps {
  history: GameAttempt[];
  filteredHistory: GameAttempt[];
  averageTime: number | null;
  bestTime: number | null;
  currentDifficulty: Difficulty;
  onClear: () => void;
}

export function HistoryPanel({
  history,
  filteredHistory,
  averageTime,
  bestTime,
  currentDifficulty,
  onClear,
}: HistoryPanelProps) {
  const currentConfig = DIFFICULTY_CONFIGS[currentDifficulty];

  if (history.length === 0) {
    return (
      <div className="bg-card border-2 border-border p-6">
        <h2 className="font-display text-2xl text-white tracking-wider mb-4">
          HISTORY
        </h2>
        <p className="text-muted-foreground">No attempts yet. Start playing!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl text-white tracking-wider">
            HISTORY
          </h2>
          <span 
            className="font-display text-sm tracking-wider px-2 py-0.5 border"
            style={{ 
              color: currentConfig.color,
              borderColor: currentConfig.color,
            }}
          >
            {currentConfig.name}
          </span>
        </div>
        <button
          onClick={onClear}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Stats row - shows stats for current difficulty */}
      <div className="grid grid-cols-2 border-b-2 border-border">
        <div className="p-4 border-r-2 border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Trophy className="w-4 h-4" style={{ color: currentConfig.color }} />
            <span>BEST ({currentConfig.name})</span>
          </div>
          <div className="font-display text-3xl" style={{ color: currentConfig.color }}>
            {bestTime ?? "—"}
            {bestTime && <span className="text-lg opacity-60 ml-1">MS</span>}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>AVERAGE</span>
          </div>
          <div className="font-display text-3xl text-white">
            {averageTime ?? "—"}
            {averageTime && <span className="text-lg text-white/60 ml-1">MS</span>}
          </div>
        </div>
      </div>

      {/* History list - shows all attempts with difficulty badges */}
      <div className="max-h-64 overflow-y-auto">
        {history.map((attempt, index) => {
          const attemptConfig = DIFFICULTY_CONFIGS[attempt.difficulty];
          const isBestForDifficulty = 
            attempt.difficulty === currentDifficulty && attempt.time === bestTime;
          
          return (
            <motion.div
              key={attempt.id}
              initial={index === 0 ? { opacity: 0, x: -20 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-between p-4 border-b border-border/50 ${
                isBestForDifficulty ? "bg-primary/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="font-display text-xl text-muted-foreground w-8">
                  #{index + 1}
                </span>
                <span className="font-display text-2xl text-white">
                  {attempt.time}
                  <span className="text-sm text-white/40 ml-1">MS</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="font-display text-xs tracking-wider px-2 py-0.5 border"
                  style={{ 
                    color: attemptConfig.color,
                    borderColor: attemptConfig.color,
                    opacity: attempt.difficulty === currentDifficulty ? 1 : 0.5,
                  }}
                >
                  {attemptConfig.name}
                </span>
                {isBestForDifficulty && (
                  <Trophy className="w-5 h-5" style={{ color: currentConfig.color }} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filtered count */}
      {filteredHistory.length !== history.length && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t border-border/50">
          Showing {history.length} total attempts ({filteredHistory.length} on {currentConfig.name})
        </div>
      )}
    </div>
  );
}
