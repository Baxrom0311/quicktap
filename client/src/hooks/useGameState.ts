import { useState, useCallback, useRef, useEffect } from "react";

export type GameState = "idle" | "waiting" | "ready" | "result" | "early";
export type Difficulty = "easy" | "normal" | "hard";

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

export interface GameAttempt {
  id: string;
  time: number;
  timestamp: Date;
  difficulty: Difficulty;
}

const STORAGE_KEY = "quicktap_history";
const DIFFICULTY_KEY = "quicktap_difficulty";
const MAX_HISTORY = 10;

function loadHistory(): GameAttempt[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        difficulty: item.difficulty || "normal", // Default for old entries
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
    if (stored && (stored === "easy" || stored === "normal" || stored === "hard")) {
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

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<GameAttempt[]>(() => loadHistory());
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => loadDifficulty());
  const [streak, setStreak] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];

  // Filter history by current difficulty for stats
  const filteredHistory = history.filter(h => h.difficulty === difficulty);

  // Calculate average from filtered history
  const averageTime = filteredHistory.length > 0
    ? Math.round(filteredHistory.reduce((sum, h) => sum + h.time, 0) / filteredHistory.length)
    : null;

  // Best time from filtered history
  const bestTime = filteredHistory.length > 0
    ? Math.min(...filteredHistory.map(h => h.time))
    : null;

  // Set difficulty with persistence
  const setDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficultyState(newDifficulty);
    saveDifficulty(newDifficulty);
  }, []);

  // Start the game - begin waiting phase
  const startGame = useCallback(() => {
    setGameState("waiting");
    setReactionTime(null);

    // Use difficulty-specific delay range
    const config = DIFFICULTY_CONFIGS[difficulty];
    const delay = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;

    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setGameState("ready");
    }, delay);
  }, [difficulty]);

  // Start immediately (for multiplayer sync)
  const startImmediate = useCallback(() => {
    setGameState("ready");
    setReactionTime(null);
    startTimeRef.current = performance.now();
  }, []);

  // Handle tap/click
  const handleTap = useCallback(() => {
    if (gameState === "waiting") {
      // Tapped too early
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setGameState("early");
      setStreak(0); // Reset streak on early tap
    } else if (gameState === "ready") {
      // Calculate reaction time
      const endTime = performance.now();
      const time = Math.round(endTime - (startTimeRef.current || endTime));
      setReactionTime(time);

      // Check if new personal best
      const currentBest = history
        .filter(h => h.difficulty === difficulty)
        .reduce((min, h) => Math.min(min, h.time), Infinity);
      setIsNewBest(time < currentBest);

      // Update streak
      setStreak(prev => prev + 1);

      // Add to history with difficulty
      const newAttempt: GameAttempt = {
        id: crypto.randomUUID(),
        time,
        timestamp: new Date(),
        difficulty,
      };

      setHistory(prev => {
        const updated = [newAttempt, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });

      setGameState("result");
    }
  }, [gameState, difficulty]);

  // Reset to idle state
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGameState("idle");
    setReactionTime(null);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
    setDifficulty,
    startGame,
    startImmediate,
    handleTap,
    reset,
    clearHistory,
  };
}
