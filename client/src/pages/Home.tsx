/*
 * DESIGN: Brutalist Speed Machine
 * - Full-screen game experience
 * - Massive typography with Bebas Neue
 * - Neon green (#39FF14) on jet black (#0A0A0A)
 * - Sharp edges, no rounded corners
 * - Instant state transitions
 * - Difficulty-based gameplay variations
 * - Sound effects for immersive feedback
 */

import { useGameState } from "@/hooks/useGameState";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { StartScreen } from "@/components/StartScreen";
import { GameArea } from "@/components/GameArea";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Footer } from "@/components/Footer";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const {
    gameState,
    reactionTime,
    history,
    filteredHistory,
    averageTime,
    bestTime,
    difficulty,
    difficultyConfig,
    setDifficulty,
    startGame,
    handleTap,
    reset,
    clearHistory,
  } = useGameState();

  const {
    playSuccess,
    playError,
    playTargetAppear,
    playExcellent,
    playClick,
    isMuted,
    toggleMute,
    initAudioContext,
  } = useSoundEffects();

  // Show game area when playing
  if (gameState !== "idle") {
    return (
      <GameArea
        gameState={gameState}
        reactionTime={reactionTime}
        difficulty={difficulty}
        difficultyConfig={difficultyConfig}
        onTap={handleTap}
        onReset={reset}
        onTryAgain={startGame}
        // Sound props
        playSuccess={playSuccess}
        playError={playError}
        playTargetAppear={playTargetAppear}
        playExcellent={playExcellent}
        isMuted={isMuted}
        toggleMute={toggleMute}
      />
    );
  }

  // Show start screen with history when idle
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key="start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {/* Start Screen with Difficulty Selector */}
          <StartScreen 
            onStart={() => {
              initAudioContext(); // Initialize audio on user interaction
              playClick();
              startGame();
            }}
            difficulty={difficulty}
            difficultyConfig={difficultyConfig}
            onDifficultyChange={(d) => {
              playClick();
              setDifficulty(d);
            }}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />

          {/* History Section */}
          {history.length > 0 && (
            <section className="py-12 px-4 bg-background">
              <div className="container max-w-2xl">
                <HistoryPanel
                  history={history}
                  filteredHistory={filteredHistory}
                  averageTime={averageTime}
                  bestTime={bestTime}
                  currentDifficulty={difficulty}
                  onClear={clearHistory}
                />
              </div>
            </section>
          )}

          {/* Footer */}
          <Footer bestTime={bestTime} averageTime={averageTime} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
