import { useState, useCallback, useRef, useEffect, useMemo } from "react";

export type GameState =
  | "idle"
  | "waiting"
  | "ready"
  | "result"
  | "early"
  | "round_summary"
  | "final_result";
export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "classic" | "genius";

export interface DifficultyConfig {
  name: string;
  description: string;
  minDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  targetSize: number; // pixels (base size)
  color: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: "EASY",
    description: "Uzoqroq kutish, katta nishon",
    minDelay: 2500,
    maxDelay: 6000,
    targetSize: 256,
    color: "oklch(0.75 0.2 142)", // Lighter green
  },
  normal: {
    name: "NORMAL",
    description: "Standart qiyinlik",
    minDelay: 1500,
    maxDelay: 5000,
    targetSize: 192,
    color: "oklch(0.85 0.3 142)", // Neon green
  },
  hard: {
    name: "HARD",
    description: "Qisqa kutish, kichik nishon",
    minDelay: 800,
    maxDelay: 3000,
    targetSize: 128,
    color: "oklch(0.65 0.25 25)", // Red-orange
  },
};

export const GENIUS_ROUNDS = 5;

export interface GameAttempt {
  id: string;
  time: number;
  timestamp: Date;
  difficulty: Difficulty;
}

const STORAGE_KEY = "quicktap_history";
const DIFFICULTY_KEY = "quicktap_difficulty";
const MODE_KEY = "quicktap_mode";
const MAX_HISTORY = 50;

function loadHistory(): GameAttempt[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        difficulty: item.difficulty || "normal",
      }));
    }
  } catch (e) {
    console.error("Failed to load history:", e);
  }
  return [];
}

function saveHistory(history: GameAttempt[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

function loadDifficulty(): Difficulty {
  try {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (
      stored &&
      (stored === "easy" || stored === "normal" || stored === "hard")
    ) {
      return stored;
    }
  } catch (e) {
    console.error("Failed to load difficulty:", e);
  }
  return "normal";
}

function saveDifficulty(difficulty: Difficulty) {
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch (e) {
    console.error("Failed to save difficulty:", e);
  }
}

function loadGameMode(): GameMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "classic" || stored === "genius") return stored;
  } catch {
    // ignore
  }
  return "classic";
}

function saveGameMode(mode: GameMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<GameAttempt[]>(() => loadHistory());
  const [difficulty, setDifficultyState] = useState<Difficulty>(() =>
    loadDifficulty()
  );
  const [gameMode, setGameModeState] = useState<GameMode>(() => loadGameMode());
  const [streak, setStreak] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Multi-round state
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState<number[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const gameStateRef = useRef<GameState>(gameState);
  const historyRef = useRef(history);
  const difficultyRef = useRef(difficulty);
  const gameModeRef = useRef(gameMode);
  const roundResultsRef = useRef(roundResults);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    roundResultsRef.current = roundResults;
  }, [roundResults]);

  const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];
  const totalRounds = gameMode === "genius" ? GENIUS_ROUNDS : 1;

  // Filter history by current difficulty for stats. Memoized so every tap does the
  // smallest possible amount of work before the next frame is painted.
  const filteredHistory = useMemo(
    () => history.filter(h => h.difficulty === difficulty),
    [history, difficulty]
  );

  const { averageTime, bestTime } = useMemo(() => {
    if (filteredHistory.length === 0) {
      return { averageTime: null, bestTime: null };
    }

    let total = 0;
    let best = Infinity;
    for (const attempt of filteredHistory) {
      total += attempt.time;
      if (attempt.time < best) best = attempt.time;
    }

    return {
      averageTime: Math.round(total / filteredHistory.length),
      bestTime: best,
    };
  }, [filteredHistory]);

  const { roundAverage, roundBest } = useMemo(() => {
    if (roundResults.length === 0) {
      return { roundAverage: null, roundBest: null };
    }

    let total = 0;
    let best = Infinity;
    for (const time of roundResults) {
      total += time;
      if (time < best) best = time;
    }

    return {
      roundAverage: Math.round(total / roundResults.length),
      roundBest: best,
    };
  }, [roundResults]);

  const setTrackedGameState = useCallback((nextState: GameState) => {
    gameStateRef.current = nextState;
    setGameState(nextState);
  }, []);

  const clearReadyTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set difficulty with persistence
  const setDifficulty = useCallback((newDifficulty: Difficulty) => {
    difficultyRef.current = newDifficulty;
    setDifficultyState(newDifficulty);
    saveDifficulty(newDifficulty);
  }, []);

  // Set game mode with persistence
  const setGameMode = useCallback((newMode: GameMode) => {
    gameModeRef.current = newMode;
    setGameModeState(newMode);
    saveGameMode(newMode);
  }, []);

  // Start a single round (internal)
  const startRound = useCallback(() => {
    clearReadyTimer();
    startTimeRef.current = null;
    setTrackedGameState("waiting");
    setReactionTime(null);

    const config = DIFFICULTY_CONFIGS[difficultyRef.current];
    const delay =
      Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      startTimeRef.current = null;
      setTrackedGameState("ready");
    }, delay);
  }, [clearReadyTimer, setTrackedGameState]);

  // Start the game
  const startGame = useCallback(() => {
    setCurrentRound(1);
    roundResultsRef.current = [];
    setRoundResults([]);
    setIsNewBest(false);
    startRound();
  }, [startRound]);

  // Start immediately (for multiplayer sync)
  const startImmediate = useCallback(() => {
    clearReadyTimer();
    setReactionTime(null);
    startTimeRef.current = null;
    setTrackedGameState("ready");
  }, [clearReadyTimer, setTrackedGameState]);

  // Starts the timer only after the ready screen is committed to the DOM, avoiding
  // React render/paint latency being counted against the player.
  const markReadyVisible = useCallback(() => {
    if (gameStateRef.current === "ready" && startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }
  }, []);

  // Proceed to next round (genius mode)
  const nextRound = useCallback(() => {
    setCurrentRound(prev => prev + 1);
    startRound();
  }, [startRound]);

  // Handle tap/click
  const handleTap = useCallback(() => {
    const currentState = gameStateRef.current;

    if (currentState === "waiting") {
      // Flip the ref immediately so pointer/click fallbacks cannot double-process
      // before React finishes rendering the early-tap screen.
      setTrackedGameState("early");
      clearReadyTimer();
      setStreak(0);
      return;
    }

    if (currentState !== "ready") return;

    // Flip state synchronously in refs first; this keeps rapid double taps from
    // producing duplicate scores while React is still scheduling updates.
    gameStateRef.current = "result";

    // Calculate reaction time with the fewest possible operations on the hot path.
    const endTime = performance.now();
    const time = Math.round(endTime - (startTimeRef.current ?? endTime));
    setReactionTime(time);

    const currentDifficulty = difficultyRef.current;
    const currentHistory = historyRef.current;
    let currentBest = Infinity;
    for (const attempt of currentHistory) {
      if (
        attempt.difficulty === currentDifficulty &&
        attempt.time < currentBest
      ) {
        currentBest = attempt.time;
      }
    }
    setIsNewBest(time < currentBest);

    setStreak(prev => prev + 1);

    if (gameModeRef.current === "genius") {
      const newRoundResults = [...roundResultsRef.current, time];
      roundResultsRef.current = newRoundResults;
      setRoundResults(newRoundResults);

      if (newRoundResults.length >= GENIUS_ROUNDS) {
        const avg = Math.round(
          newRoundResults.reduce((s, t) => s + t, 0) / newRoundResults.length
        );
        const newAttempt: GameAttempt = {
          id: crypto.randomUUID(),
          time: avg,
          timestamp: new Date(),
          difficulty: currentDifficulty,
        };

        setHistory(prev => {
          const updated = [newAttempt, ...prev].slice(0, MAX_HISTORY);
          historyRef.current = updated;
          saveHistory(updated);
          return updated;
        });

        setReactionTime(avg);
        setTrackedGameState("final_result");
      } else {
        setTrackedGameState("round_summary");
      }
      return;
    }

    const newAttempt: GameAttempt = {
      id: crypto.randomUUID(),
      time,
      timestamp: new Date(),
      difficulty: currentDifficulty,
    };

    setHistory(prev => {
      const updated = [newAttempt, ...prev].slice(0, MAX_HISTORY);
      historyRef.current = updated;
      saveHistory(updated);
      return updated;
    });

    setTrackedGameState("result");
  }, [clearReadyTimer, setTrackedGameState]);

  // Reset to idle state
  const reset = useCallback(() => {
    clearReadyTimer();
    startTimeRef.current = null;
    setTrackedGameState("idle");
    setReactionTime(null);
    setIsNewBest(false);
    setCurrentRound(1);
    roundResultsRef.current = [];
    setRoundResults([]);
  }, [clearReadyTimer, setTrackedGameState]);

  // Clear history
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReadyTimer();
    };
  }, [clearReadyTimer]);

  return {
    gameState,
    reactionTime,
    history,
    filteredHistory,
    averageTime,
    bestTime,
    difficulty,
    difficultyConfig,
    streak,
    isNewBest,
    // Game mode
    gameMode,
    setGameMode,
    // Multi-round
    currentRound,
    totalRounds,
    roundResults,
    roundAverage,
    roundBest,
    nextRound,
    // Actions
    setDifficulty,
    startGame,
    startImmediate,
    handleTap,
    markReadyVisible,
    reset,
    clearHistory,
  };
}
