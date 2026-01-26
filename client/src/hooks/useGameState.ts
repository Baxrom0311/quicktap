import { useState, useCallback, useRef, useEffect } from "react";

export type GameState = "idle" | "waiting" | "ready" | "result" | "early";

export interface GameAttempt {
  id: string;
  time: number;
  timestamp: Date;
}

const STORAGE_KEY = "quicktap_history";
const MAX_HISTORY = 10;

function loadHistory(): GameAttempt[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
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

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<GameAttempt[]>(() => loadHistory());
  
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate average from history
  const averageTime = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.time, 0) / history.length)
    : null;

  // Best time from history
  const bestTime = history.length > 0
    ? Math.min(...history.map(h => h.time))
    : null;

  // Start the game - begin waiting phase
  const startGame = useCallback(() => {
    setGameState("waiting");
    setReactionTime(null);
    
    // Random delay between 1.5 and 5 seconds
    const delay = Math.random() * 3500 + 1500;
    
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setGameState("ready");
    }, delay);
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
    } else if (gameState === "ready") {
      // Calculate reaction time
      const endTime = performance.now();
      const time = Math.round(endTime - (startTimeRef.current || endTime));
      setReactionTime(time);
      
      // Add to history
      const newAttempt: GameAttempt = {
        id: crypto.randomUUID(),
        time,
        timestamp: new Date(),
      };
      
      setHistory(prev => {
        const updated = [newAttempt, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });
      
      setGameState("result");
    }
  }, [gameState]);

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
    averageTime,
    bestTime,
    startGame,
    handleTap,
    reset,
    clearHistory,
  };
}
