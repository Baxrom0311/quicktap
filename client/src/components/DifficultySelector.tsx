/*
 * DESIGN: Brutalist Speed Machine
 * - Sharp-edged difficulty cards
 * - Color-coded difficulty levels
 * - Instant selection feedback
 */

import { motion } from "framer-motion";
import { Zap, Target, Flame } from "lucide-react";
import type { Difficulty, DifficultyConfig } from "@/hooks/useGameState";
import { DIFFICULTY_CONFIGS } from "@/hooks/useGameState";

interface DifficultySelectorProps {
  currentDifficulty: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const DIFFICULTY_ICONS: Record<Difficulty, React.ReactNode> = {
  easy: <Target className="w-6 h-6" />,
  normal: <Zap className="w-6 h-6" />,
  hard: <Flame className="w-6 h-6" />,
};

export function DifficultySelector({ currentDifficulty, onSelect }: DifficultySelectorProps) {
  const difficulties: Difficulty[] = ["easy", "normal", "hard"];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="font-display text-xl text-white/60 tracking-wider mb-4 text-center">
        SELECT DIFFICULTY
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {difficulties.map((diff) => (
          <DifficultyCard
            key={diff}
            difficulty={diff}
            config={DIFFICULTY_CONFIGS[diff]}
            icon={DIFFICULTY_ICONS[diff]}
            isSelected={currentDifficulty === diff}
            onSelect={() => onSelect(diff)}
          />
        ))}
      </div>
    </div>
  );
}

interface DifficultyCardProps {
  difficulty: Difficulty;
  config: DifficultyConfig;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

function DifficultyCard({ difficulty, config, icon, isSelected, onSelect }: DifficultyCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative p-4 border-2 transition-colors text-left ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/50"
      }`}
      style={{
        borderColor: isSelected ? config.color : undefined,
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          layoutId="difficulty-indicator"
          className="absolute inset-0 border-2"
          style={{ borderColor: config.color }}
          transition={{ duration: 0.15 }}
        />
      )}

      <div className="relative z-10">
        {/* Icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: config.color }}>{icon}</span>
          <span 
            className="font-display text-lg tracking-wider"
            style={{ color: isSelected ? config.color : "white" }}
          >
            {config.name}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-tight">
          {config.description}
        </p>

        {/* Stats */}
        <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Delay</span>
            <span>{(config.minDelay / 1000).toFixed(1)}-{(config.maxDelay / 1000).toFixed(1)}s</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Target</span>
            <span>{config.targetSize}px</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
