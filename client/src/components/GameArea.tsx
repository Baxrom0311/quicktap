/*
 * DESIGN: Brutalist Speed Machine
 * - Full-screen immersive game area
 * - Giant reaction time numbers (60% viewport)
 * - Instant state changes, no easing
 * - Neon green target with glow effect
 */

import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@/hooks/useGameState";

interface GameAreaProps {
  gameState: GameState;
  reactionTime: number | null;
  onTap: () => void;
  onReset: () => void;
  onTryAgain: () => void;
}

export function GameArea({
  gameState,
  reactionTime,
  onTap,
  onReset,
  onTryAgain,
}: GameAreaProps) {
  const handleClick = () => {
    if (gameState === "waiting" || gameState === "ready") {
      onTap();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden"
      onClick={handleClick}
      style={{
        background: gameState === "ready" 
          ? "oklch(0.15 0.1 142)" 
          : gameState === "early"
          ? "oklch(0.15 0.1 25)"
          : "oklch(0.08 0 0)",
      }}
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('/images/diagonal-pattern.png')",
          backgroundSize: "200px",
        }}
      />

      <AnimatePresence mode="wait">
        {gameState === "waiting" && <WaitingState key="waiting" />}
        {gameState === "ready" && <ReadyState key="ready" />}
        {gameState === "early" && (
          <EarlyState key="early" onTryAgain={onTryAgain} />
        )}
        {gameState === "result" && reactionTime !== null && (
          <ResultState
            key="result"
            reactionTime={reactionTime}
            onTryAgain={onTryAgain}
            onReset={onReset}
          />
        )}
      </AnimatePresence>

      {/* Back button - always visible */}
      {(gameState === "waiting" || gameState === "ready") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="absolute top-6 left-6 z-20 text-white/50 hover:text-white font-display text-xl tracking-wider"
        >
          ← BACK
        </button>
      )}
    </div>
  );
}

function WaitingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="text-center z-10"
    >
      <div className="font-display text-4xl md:text-6xl text-white/80 tracking-wider">
        WAIT FOR
      </div>
      <div className="font-display text-6xl md:text-8xl text-primary neon-glow mt-4">
        GREEN
      </div>
      <p className="mt-8 text-white/40 text-lg">Don't tap yet...</p>
    </motion.div>
  );
}

function ReadyState() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.05, type: "tween" }}
      className="text-center z-10"
    >
      {/* Target circle */}
      <div className="relative">
        <div 
          className="w-48 h-48 md:w-64 md:h-64 bg-primary animate-target-pulse flex items-center justify-center"
          style={{
            clipPath: "circle(50%)",
          }}
        >
          <span className="font-display text-4xl md:text-6xl text-primary-foreground">
            TAP!
          </span>
        </div>
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 text-primary font-display text-2xl tracking-wider"
      >
        NOW!
      </motion.p>
    </motion.div>
  );
}

interface EarlyStateProps {
  onTryAgain: () => void;
}

function EarlyState({ onTryAgain }: EarlyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="text-center z-10 px-4"
    >
      <div className="font-display text-6xl md:text-8xl text-destructive tracking-wider">
        TOO EARLY!
      </div>
      <p className="mt-4 text-white/60 text-lg">Wait for the green target</p>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTryAgain();
        }}
        className="mt-12 px-12 py-4 bg-transparent border-2 border-white text-white font-display text-2xl tracking-wider hover:bg-white hover:text-black transition-colors"
      >
        TRY AGAIN
      </button>
    </motion.div>
  );
}

interface ResultStateProps {
  reactionTime: number;
  onTryAgain: () => void;
  onReset: () => void;
}

function ResultState({ reactionTime, onTryAgain, onReset }: ResultStateProps) {
  const rating = getReactionRating(reactionTime);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="text-center z-10 px-4"
    >
      {/* Giant reaction time display */}
      <div className="relative">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, type: "tween" }}
          className="font-display text-[clamp(6rem,25vw,16rem)] leading-none text-primary neon-glow"
        >
          {reactionTime}
        </motion.div>
        <div className="font-display text-2xl md:text-4xl text-white/60 tracking-widest -mt-4">
          MILLISECONDS
        </div>
      </div>

      {/* Rating */}
      <div className="mt-8">
        <span 
          className="font-display text-3xl md:text-4xl tracking-wider"
          style={{ color: rating.color }}
        >
          {rating.label}
        </span>
      </div>

      {/* Action buttons */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTryAgain();
          }}
          className="px-12 py-4 bg-primary text-primary-foreground font-display text-2xl tracking-wider hover:bg-transparent hover:text-primary border-2 border-primary transition-colors"
        >
          TRY AGAIN
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="px-12 py-4 bg-transparent border-2 border-white/30 text-white/60 font-display text-2xl tracking-wider hover:border-white hover:text-white transition-colors"
        >
          HOME
        </button>
      </div>
    </motion.div>
  );
}

function getReactionRating(time: number): { label: string; color: string } {
  if (time < 150) return { label: "INHUMAN!", color: "oklch(0.85 0.3 142)" };
  if (time < 200) return { label: "LIGHTNING FAST!", color: "oklch(0.85 0.3 142)" };
  if (time < 250) return { label: "EXCELLENT!", color: "oklch(0.8 0.25 142)" };
  if (time < 300) return { label: "GREAT!", color: "oklch(0.75 0.2 142)" };
  if (time < 350) return { label: "GOOD", color: "oklch(0.7 0.15 90)" };
  if (time < 400) return { label: "AVERAGE", color: "oklch(0.65 0.1 60)" };
  return { label: "KEEP PRACTICING", color: "oklch(0.6 0.05 30)" };
}
