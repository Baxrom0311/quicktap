/*
 * DESIGN: Brutalist Speed Machine
 * - Full-screen immersive game area
 * - Giant reaction time numbers (60% viewport)
 * - Instant state changes, no easing
 * - Difficulty-based target size and colors
 * - Keyboard support: Spacebar and Enter for tapping
 * - Sound effects for immersive feedback
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { GameState, DifficultyConfig, Difficulty } from "@/hooks/useGameState";

interface GameAreaProps {
  gameState: GameState;
  reactionTime: number | null;
  difficulty: Difficulty;
  difficultyConfig: DifficultyConfig;
  onTap: () => void;
  onReset: () => void;
  onTryAgain: () => void;
  // Sound props
  playSuccess: () => void;
  playError: () => void;
  playTargetAppear: () => void;
  playExcellent: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function GameArea({
  gameState,
  reactionTime,
  difficulty,
  difficultyConfig,
  onTap,
  onReset,
  onTryAgain,
  playSuccess,
  playError,
  playTargetAppear,
  playExcellent,
  isMuted,
  toggleMute,
}: GameAreaProps) {
  const prevGameStateRef = useRef<GameState>(gameState);

  // Play sounds on state changes
  useEffect(() => {
    const prevState = prevGameStateRef.current;
    
    // Target appeared
    if (prevState === "waiting" && gameState === "ready") {
      playTargetAppear();
    }
    
    // Early tap
    if (gameState === "early" && prevState !== "early") {
      playError();
    }
    
    // Successful tap - play different sound based on reaction time
    if (gameState === "result" && prevState === "ready" && reactionTime !== null) {
      // Adjust threshold based on difficulty
      const excellentThreshold = difficulty === "easy" ? 250 : difficulty === "hard" ? 180 : 220;
      if (reactionTime < excellentThreshold) {
        playExcellent();
      } else {
        playSuccess();
      }
    }
    
    prevGameStateRef.current = gameState;
  }, [gameState, reactionTime, difficulty, playTargetAppear, playError, playSuccess, playExcellent]);

  const handleClick = () => {
    if (gameState === "waiting" || gameState === "ready") {
      onTap();
    }
  };

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default behavior for spacebar (scrolling) and Enter
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      
      if (gameState === "waiting" || gameState === "ready") {
        onTap();
      } else if (gameState === "early" || gameState === "result") {
        onTryAgain();
      }
    }
    
    // Escape key to go back
    if (event.code === "Escape") {
      event.preventDefault();
      onReset();
    }

    // M key to toggle mute
    if (event.code === "KeyM") {
      event.preventDefault();
      toggleMute();
    }
  }, [gameState, onTap, onTryAgain, onReset, toggleMute]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden"
      onClick={handleClick}
      tabIndex={0}
      style={{
        background: gameState === "ready" 
          ? difficulty === "hard" 
            ? "oklch(0.15 0.08 25)" 
            : "oklch(0.15 0.1 142)" 
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

      {/* Top bar with difficulty and mute button */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        {/* Mute button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="p-2 text-white/50 hover:text-white transition-colors"
          title={isMuted ? "Unmute [M]" : "Mute [M]"}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
        
        {/* Difficulty indicator */}
        <span 
          className="font-display text-lg tracking-wider px-3 py-1 border-2"
          style={{ 
            color: difficultyConfig.color,
            borderColor: difficultyConfig.color,
          }}
        >
          {difficultyConfig.name}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {gameState === "waiting" && (
          <WaitingState key="waiting" difficultyConfig={difficultyConfig} />
        )}
        {gameState === "ready" && (
          <ReadyState key="ready" difficultyConfig={difficultyConfig} />
        )}
        {gameState === "early" && (
          <EarlyState key="early" onTryAgain={onTryAgain} />
        )}
        {gameState === "result" && reactionTime !== null && (
          <ResultState
            key="result"
            reactionTime={reactionTime}
            difficulty={difficulty}
            difficultyConfig={difficultyConfig}
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
          className="absolute top-6 left-6 z-20 text-white/50 hover:text-white font-display text-xl tracking-wider flex items-center gap-2"
        >
          ← BACK
          <span className="text-sm text-white/30">[ESC]</span>
        </button>
      )}

      {/* Keyboard hint */}
      {(gameState === "waiting" || gameState === "ready") && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <KeyboardHint />
        </div>
      )}
    </div>
  );
}

function KeyboardHint() {
  return (
    <div className="flex items-center gap-4 text-white/40 text-sm">
      <div className="flex items-center gap-2">
        <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 font-display text-xs">
          SPACE
        </kbd>
        <span>or</span>
        <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 font-display text-xs">
          ENTER
        </kbd>
        <span>to tap</span>
      </div>
    </div>
  );
}

interface WaitingStateProps {
  difficultyConfig: DifficultyConfig;
}

function WaitingState({ difficultyConfig }: WaitingStateProps) {
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
      <div 
        className="font-display text-6xl md:text-8xl mt-4 neon-glow"
        style={{ color: difficultyConfig.color }}
      >
        {difficultyConfig.name === "HARD" ? "RED" : "GREEN"}
      </div>
      <p className="mt-8 text-white/40 text-lg">Don't tap yet...</p>
    </motion.div>
  );
}

interface ReadyStateProps {
  difficultyConfig: DifficultyConfig;
}

function ReadyState({ difficultyConfig }: ReadyStateProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.05, type: "tween" }}
      className="text-center z-10"
    >
      {/* Target circle - size based on difficulty */}
      <div className="relative">
        <div 
          className="flex items-center justify-center animate-target-pulse"
          style={{
            width: `${difficultyConfig.targetSize}px`,
            height: `${difficultyConfig.targetSize}px`,
            backgroundColor: difficultyConfig.color,
            clipPath: "circle(50%)",
            boxShadow: `0 0 20px ${difficultyConfig.color}, 0 0 40px ${difficultyConfig.color}`,
          }}
        >
          <span 
            className="font-display text-primary-foreground"
            style={{
              fontSize: `${difficultyConfig.targetSize / 4}px`,
            }}
          >
            TAP!
          </span>
        </div>
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 font-display text-2xl tracking-wider"
        style={{ color: difficultyConfig.color }}
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
      <p className="mt-4 text-white/60 text-lg">Wait for the target to appear</p>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTryAgain();
        }}
        className="mt-12 px-12 py-4 bg-transparent border-2 border-white text-white font-display text-2xl tracking-wider hover:bg-white hover:text-black transition-colors"
      >
        TRY AGAIN
        <span className="ml-3 text-sm text-white/50">[SPACE]</span>
      </button>
    </motion.div>
  );
}

interface ResultStateProps {
  reactionTime: number;
  difficulty: Difficulty;
  difficultyConfig: DifficultyConfig;
  onTryAgain: () => void;
  onReset: () => void;
}

function ResultState({ reactionTime, difficulty, difficultyConfig, onTryAgain, onReset }: ResultStateProps) {
  const rating = getReactionRating(reactionTime, difficulty);
  
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
          className="font-display text-[clamp(6rem,25vw,16rem)] leading-none neon-glow"
          style={{ color: difficultyConfig.color }}
        >
          {reactionTime}
        </motion.div>
        <div className="font-display text-2xl md:text-4xl text-white/60 tracking-widest -mt-4">
          MILLISECONDS
        </div>
      </div>

      {/* Difficulty badge */}
      <div className="mt-4">
        <span 
          className="font-display text-lg tracking-wider px-3 py-1 border-2"
          style={{ 
            color: difficultyConfig.color,
            borderColor: difficultyConfig.color,
          }}
        >
          {difficultyConfig.name} MODE
        </span>
      </div>

      {/* Rating */}
      <div className="mt-6">
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
          className="px-12 py-4 text-primary-foreground font-display text-2xl tracking-wider hover:opacity-90 border-2 transition-colors"
          style={{
            backgroundColor: difficultyConfig.color,
            borderColor: difficultyConfig.color,
          }}
        >
          TRY AGAIN
          <span className="ml-3 text-sm opacity-60">[SPACE]</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="px-12 py-4 bg-transparent border-2 border-white/30 text-white/60 font-display text-2xl tracking-wider hover:border-white hover:text-white transition-colors"
        >
          HOME
          <span className="ml-3 text-sm opacity-60">[ESC]</span>
        </button>
      </div>
    </motion.div>
  );
}

function getReactionRating(time: number, difficulty: Difficulty): { label: string; color: string } {
  // Adjust thresholds based on difficulty
  const multiplier = difficulty === "easy" ? 1.2 : difficulty === "hard" ? 0.85 : 1;
  
  if (time < 150 * multiplier) return { label: "INHUMAN!", color: "oklch(0.85 0.3 142)" };
  if (time < 200 * multiplier) return { label: "LIGHTNING FAST!", color: "oklch(0.85 0.3 142)" };
  if (time < 250 * multiplier) return { label: "EXCELLENT!", color: "oklch(0.8 0.25 142)" };
  if (time < 300 * multiplier) return { label: "GREAT!", color: "oklch(0.75 0.2 142)" };
  if (time < 350 * multiplier) return { label: "GOOD", color: "oklch(0.7 0.15 90)" };
  if (time < 400 * multiplier) return { label: "AVERAGE", color: "oklch(0.65 0.1 60)" };
  return { label: "KEEP PRACTICING", color: "oklch(0.6 0.05 30)" };
}
