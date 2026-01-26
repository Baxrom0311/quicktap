/*
 * DESIGN: Brutalist Speed Machine
 * - Sharp borders, no rounded corners
 * - Diagonal stripe accents
 * - Condensed data display
 */

import { motion } from "framer-motion";
import { Trash2, Trophy, TrendingUp } from "lucide-react";
import type { GameAttempt } from "@/hooks/useGameState";

interface HistoryPanelProps {
  history: GameAttempt[];
  averageTime: number | null;
  bestTime: number | null;
  onClear: () => void;
}

export function HistoryPanel({
  history,
  averageTime,
  bestTime,
  onClear,
}: HistoryPanelProps) {
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
        <h2 className="font-display text-2xl text-white tracking-wider">
          HISTORY
        </h2>
        <button
          onClick={onClear}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 border-b-2 border-border">
        <div className="p-4 border-r-2 border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Trophy className="w-4 h-4 text-primary" />
            <span>BEST</span>
          </div>
          <div className="font-display text-3xl text-primary">
            {bestTime}
            <span className="text-lg text-primary/60 ml-1">MS</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>AVERAGE</span>
          </div>
          <div className="font-display text-3xl text-white">
            {averageTime}
            <span className="text-lg text-white/60 ml-1">MS</span>
          </div>
        </div>
      </div>

      {/* History list */}
      <div className="max-h-64 overflow-y-auto">
        {history.map((attempt, index) => (
          <motion.div
            key={attempt.id}
            initial={index === 0 ? { opacity: 0, x: -20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-between p-4 border-b border-border/50 ${
              attempt.time === bestTime ? "bg-primary/10" : ""
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
            {attempt.time === bestTime && (
              <Trophy className="w-5 h-5 text-primary" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
