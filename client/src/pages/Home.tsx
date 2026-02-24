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
import { ProfileSetupDialog } from "@/components/ProfileSetupDialog";
import { useUser } from "@/contexts/UserContext";
import { getAvatarById } from "@shared/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

// Multiplayer imports
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { MultiplayerMenu } from "@/components/MultiplayerMenu";
import { JoinGameDialog } from "@/components/JoinGameDialog";
import { Lobby } from "@/components/Lobby";
import { CountdownOverlay } from "@/components/CountdownOverlay";
import { MultiplayerGameOver } from "@/components/MultiplayerGameOver";
import { toast } from "sonner";
import { Users, Settings } from "lucide-react";

export default function Home() {
  const { user, setUser, hasProfile } = useUser();
  const [showProfileSetup, setShowProfileSetup] = useState(!hasProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Multiplayer State
  const [view, setView] = useState<'main' | 'multiplayer_menu' | 'join_dialog' | 'lobby'>('main');
  const [joinCode, setJoinCode] = useState<string>('');

  // Check for join code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('joinCode');
    if (code) {
      setJoinCode(code);
      setView('join_dialog');
      // Clean up URL without reload
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const {
    status: mpStatus,
    room,
    opponent,
    currentRound: mpCurrentRound,
    totalRounds: mpTotalRounds,
    roundWinners,
    createRoom,
    joinRoom,
    setReady,
    sendScore,
    finishGame,
    leaveRoom
  } = useMultiplayer(user);
  const prevMpStatusRef = useRef(mpStatus);

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
    startImmediate,
    handleTap,
    reset,
    clearHistory,
    streak,
    isNewBest,
    // Multi-round
    gameMode,
    setGameMode,
    currentRound,
    totalRounds,
    roundResults,
    roundAverage,
    roundBest,
    nextRound,
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

  // Start a fresh local round whenever server transitions into playing.
  useEffect(() => {
    const prevStatus = prevMpStatusRef.current;
    if (prevStatus !== 'playing' && mpStatus === 'playing') {
      startImmediate();
      initAudioContext();
    }
    prevMpStatusRef.current = mpStatus;
  }, [mpStatus, startImmediate, initAudioContext]);

  useEffect(() => {
    if (view === 'lobby' && !room) {
      setView('main');
    }
  }, [view, room]);

  // Send score when reaction time is recorded
  useEffect(() => {
    if (view === 'lobby' && mpStatus === 'playing' && reactionTime !== null) {
      sendScore(reactionTime);
      finishGame(reactionTime);
    }
  }, [reactionTime, mpStatus, view, sendScore, finishGame]);

  const handleMultiplayerTap = () => {
    handleTap();
    // Score sending is handled in effect above
  };

  const handleReset = () => {
    if (view !== 'main') {
      if (view === 'lobby') {
        leaveRoom();
      }
      setView('main');
    }
    reset();
  };

  // Multiplayer Game Over screen
  if (view === 'lobby' && mpStatus === 'finished' && room) {
    return (
      <MultiplayerGameOver
        players={room.players}
        currentUserId={user?.userId || ''}
        roundWinners={roundWinners}
        totalRounds={mpTotalRounds}
        onRematch={() => {
          // Reset local state, go back to lobby and set ready
          reset();
          setReady();
        }}
        onLeave={() => {
          leaveRoom();
          reset();
          setView('main');
        }}
      />
    );
  }

  // Show game area when playing (Single or Multiplayer)
  if (gameState !== "idle" || (view === 'lobby' && mpStatus === 'playing')) {
    const isMultiplayerMode = view === 'lobby';

    return (
      <GameArea
        gameState={gameState}
        reactionTime={reactionTime}
        difficulty={difficulty}
        difficultyConfig={difficultyConfig}
        onTap={isMultiplayerMode ? handleMultiplayerTap : handleTap}
        onReset={handleReset}
        onTryAgain={isMultiplayerMode ? () => { } : startGame}
        onNextRound={nextRound}

        // Sound props
        playSuccess={playSuccess}
        playError={playError}
        playTargetAppear={playTargetAppear}
        playExcellent={playExcellent}
        isMuted={isMuted}
        toggleMute={toggleMute}

        // Multiplayer props
        isMultiplayer={isMultiplayerMode}
        opponent={opponent}

        // Gameplay props
        streak={streak}
        isNewBest={isNewBest}

        // Multi-round props
        gameMode={gameMode}
        currentRound={currentRound}
        totalRounds={totalRounds}
        roundResults={roundResults}
        roundAverage={roundAverage}
        roundBest={roundBest}
      />
    );
  }

  // Show start screen with history when idle
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Profile Setup / Edit Dialog */}
      <ProfileSetupDialog
        open={showProfileSetup || isEditingProfile}
        existingProfile={isEditingProfile ? user : null}
        onComplete={(profile) => {
          setUser(profile);
          setShowProfileSetup(false);
          setIsEditingProfile(false);
        }}
        onClose={() => setIsEditingProfile(false)}
      />

      {/* Join Game Dialog */}
      <JoinGameDialog
        open={view === 'join_dialog'}
        initialCode={joinCode}
        onJoin={async (code) => {
          const success = await joinRoom(code);
          if (success) {
            setView('lobby');
          }
          return success;
        }}
        onCancel={() => setView('multiplayer_menu')}
      />

      {/* User Profile Badge (top right) - clickable to edit */}
      {user && (() => {
        const avatarData = getAvatarById(user.avatar);
        return (
          <button
            onClick={() => setIsEditingProfile(true)}
            className="fixed top-6 right-6 z-10 flex items-center gap-3 px-4 py-2 bg-card border-2 border-border hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-border flex items-center justify-center">
              {avatarData && (
                <span className="text-2xl">{avatarData.emoji}</span>
              )}
            </div>
            <span className="font-display text-white tracking-wider">{user.username}</span>
            <Settings className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </button>
        );
      })()}

      <AnimatePresence mode="wait">
        {view === 'main' && (
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
                initAudioContext();
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
              gameMode={gameMode}
              onGameModeChange={(mode) => {
                playClick();
                setGameMode(mode);
              }}
            />

            {/* Multiplayer Button */}
            <div className="flex justify-center -mt-8 pb-12 relative z-20">
              <button
                onClick={() => {
                  playClick();
                  if (!user) {
                    setShowProfileSetup(true);
                    return;
                  }
                  if (navigator.onLine) {
                    setView('multiplayer_menu');
                  } else {
                    toast.error("Multiplayer uchun internet kerak");
                  }
                }}
                className="flex items-center gap-3 px-8 py-4 bg-white/5 border-2 border-white/20 text-white font-display text-xl tracking-wider hover:bg-white/10 hover:border-white transition-all transform hover:scale-105"
              >
                <Users className="w-6 h-6" />
                MULTIPLAYER
              </button>
            </div>

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
        )}

        {view === 'multiplayer_menu' && (
          <div className="flex-1 flex flex-col justify-center">
            <MultiplayerMenu
              onCreate={async () => {
                const success = await createRoom();
                if (success) {
                  setView('lobby');
                }
              }}
              onJoin={() => setView('join_dialog')}
              onCancel={() => setView('main')}
            />
          </div>
        )}

        {view === 'lobby' && room && (
          <div className="flex-1 flex flex-col justify-center pt-20">
            <Lobby
              room={room}
              currentUserSocketId={room.players.find(p => p.userId === user?.userId)?.socketId || ''}
              onReady={setReady}
              onLeave={() => {
                leaveRoom();
                setView('main');
              }}
            />
            {/* Countdown overlay */}
            <CountdownOverlay active={mpStatus === 'countdown'} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
