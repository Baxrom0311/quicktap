/*
 * DESIGN: Brutalist Speed Machine
 * - Massive display typography with Bebas Neue
 * - Diagonal cuts and aggressive angles
 * - Neon green accents on black
 * - No rounded corners, sharp edges only
 * - Keyboard support: Enter/Space to start
 * - Sound toggle control
 */

import { motion } from "framer-motion";
import { Zap, Target, Clock, Volume2, VolumeX } from "lucide-react";
import { useEffect, useCallback } from "react";
import { DifficultySelector } from "./DifficultySelector";
import type { Difficulty, DifficultyConfig } from "@/hooks/useGameState";

interface StartScreenProps {
  onStart: () => void;
  difficulty: Difficulty;
  difficultyConfig: DifficultyConfig;
  onDifficultyChange: (difficulty: Difficulty) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function StartScreen({
  onStart,
  difficulty,
  difficultyConfig,
  onDifficultyChange,
  isMuted,
  toggleMute,
}: StartScreenProps) {
  // Keyboard event handler for start screen
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore hotkeys when user is typing in input/textarea fields
    const target = document.activeElement as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (isInput) {
      return;
    }

    // Enter or Space to start the game
    if (event.code === "Enter" || event.code === "Space") {
      // Only if not focused on a button or interactive element (though button usually handles click on Enter)
      const isButton = target.tagName === "BUTTON";

      if (!isButton) {
        event.preventDefault();
        onStart();
      }
    }

    // Number keys 1-3 to select difficulty
    if (event.code === "Digit1" || event.code === "Numpad1") {
      event.preventDefault();
      onDifficultyChange("easy");
    } else if (event.code === "Digit2" || event.code === "Numpad2") {
      event.preventDefault();
      onDifficultyChange("normal");
    } else if (event.code === "Digit3" || event.code === "Numpad3") {
      event.preventDefault();
      onDifficultyChange("hard");
    }

    // M key to toggle mute
    if (event.code === "KeyM") {
      event.preventDefault();
      toggleMute();
    }
  }, [onStart, onDifficultyChange, toggleMute]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Hero Section with diagonal cut */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-4 py-12"
        style={{
          backgroundImage: "url('/images/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Mute button - top right */}
        <button
          onClick={toggleMute}
          className="absolute top-6 right-6 z-20 p-2 text-white/50 hover:text-white transition-colors"
          title={isMuted ? "Ovozni yoqish [M]" : "Ovozni o'chirish [M]"}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 text-center"
        >
          {/* Logo/Title */}
          <h1 className="font-display text-[clamp(4rem,15vw,12rem)] leading-none tracking-tight text-white">
            QUICK
            <span className="text-primary neon-glow">TAP</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-white/80 font-medium tracking-wide uppercase">
            Reaktsiya Tezligingizni Sinab Ko'ring
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full px-4"
        >
          <InstructionCard
            icon={<Clock className="w-8 h-8" />}
            step="01"
            title="KUTISH"
            description="Yashil nishon paydo bo'lishini kuting"
          />
          <InstructionCard
            icon={<Target className="w-8 h-8" />}
            step="02"
            title="BOSING"
            description="Bosing yoki Space/Enter tugmalarini bosing"
          />
          <InstructionCard
            icon={<Zap className="w-8 h-8" />}
            step="03"
            title="YAXSHILANG"
            description="Vaqtlaringizni kuzatib, rekordingizni yangilang"
          />
        </motion.div>

        {/* Difficulty Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="relative z-10 mt-8 w-full px-4"
        >
          <DifficultySelector
            currentDifficulty={difficulty}
            onSelect={onDifficultyChange}
          />
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="relative z-10 mt-8 px-16 py-6 bg-primary text-primary-foreground font-display text-4xl md:text-5xl tracking-wider neon-box-glow border-4 border-primary hover:bg-transparent hover:text-primary transition-colors"
          style={{
            backgroundColor: difficultyConfig.color,
            borderColor: difficultyConfig.color,
          }}
        >
          BOSHLASH {difficultyConfig.name}
        </motion.button>

        {/* Keyboard hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="relative z-10 mt-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-display text-xs">
                SPACE
              </kbd>
              <span>yoki</span>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-display text-xs">
                ENTER
              </kbd>
              <span>boshlash uchun</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-display text-xs">
                1
              </kbd>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-display text-xs">
                2
              </kbd>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-display text-xs">
                3
              </kbd>
              <span>qiyinlik</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 font-display text-xs">
                M
              </kbd>
              <span>ovozni o'chirish</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Diagonal stripe divider */}
      <div
        className="h-8 w-full"
        style={{
          background: "repeating-linear-gradient(135deg, transparent, transparent 10px, oklch(0.85 0.3 142 / 0.3) 10px, oklch(0.85 0.3 142 / 0.3) 20px)",
        }}
      />
    </div>
  );
}

interface InstructionCardProps {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}

function InstructionCard({ icon, step, title, description }: InstructionCardProps) {
  return (
    <div className="relative bg-black/60 border-2 border-primary/30 p-4 backdrop-blur-sm">
      {/* Step number - positioned at top right */}
      <span className="absolute top-2 right-4 font-display text-5xl text-primary/20">
        {step}
      </span>

      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-display text-xl text-white mb-1">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}
