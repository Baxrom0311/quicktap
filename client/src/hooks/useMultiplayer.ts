import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { UserProfile } from "@shared/types";
import { toast } from "sonner";

// Determine API URL (should match the backend)
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? window.location.origin : "http://localhost:3001");

export type MultiplayerStatus =
  | "idle"
  | "lobby"
  | "countdown"
  | "playing"
  | "finished";

interface RoundStartPayload {
  round?: number;
  totalRounds?: number;
  startAt?: number;
  serverNow?: number;
}

interface TimeSyncResponse {
  serverNow?: number;
}

export interface Player {
  socketId: string;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  isReady: boolean;
  finished: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  status: MultiplayerStatus;
  createdAt: number;
  currentRound?: number;
  totalRounds?: number;
  roundWinners?: string[];
}

export function useMultiplayer(user: UserProfile | null) {
  const [status, setStatus] = useState<MultiplayerStatus>("idle");
  const [room, setRoom] = useState<Room | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [roundWinners, setRoundWinners] = useState<string[]>([]);
  const [countdownStartAt, setCountdownStartAt] = useState<number | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverClockOffsetRef = useRef<number | null>(null);
  const bestClockSyncRttRef = useRef<number | null>(null);

  const clearStartTimer = useCallback(() => {
    if (!startTimerRef.current) return;
    clearTimeout(startTimerRef.current);
    startTimerRef.current = null;
  }, []);

  const applyRoundStart = useCallback(
    (data?: RoundStartPayload) => {
      clearStartTimer();
      setCountdownStartAt(null);
      setStatus("playing");
      if (data?.round) setCurrentRound(data.round);
      if (data?.totalRounds) setTotalRounds(data.totalRounds);
    },
    [clearStartTimer]
  );

  const scheduleLocalRoundStart = useCallback(
    (data?: RoundStartPayload) => {
      clearStartTimer();

      if (data?.round) setCurrentRound(data.round);
      if (data?.totalRounds) setTotalRounds(data.totalRounds);

      if (!data?.startAt || !data?.serverNow) {
        setCountdownStartAt(null);
        setStatus("countdown");
        return;
      }

      const fallbackOffset = data.serverNow - Date.now();
      const clockOffset = serverClockOffsetRef.current ?? fallbackOffset;
      const localStartAt = data.startAt - clockOffset;
      const delay = Math.max(0, localStartAt - Date.now());

      setCountdownStartAt(localStartAt);
      setStatus("countdown");
      startTimerRef.current = setTimeout(() => {
        startTimerRef.current = null;
        setCountdownStartAt(null);
        setStatus("playing");
      }, delay);
    },
    [clearStartTimer]
  );

  useEffect(() => {
    if (user) return;
    setStatus("idle");
    setRoom(null);
    setOpponent(null);
    setSocket(null);
    setCurrentRound(1);
    setTotalRounds(3);
    setRoundWinners([]);
    setCountdownStartAt(null);
    clearStartTimer();
  }, [user, clearStartTimer]);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    console.log("Connecting to socket at:", API_URL);
    const newSocket = io(API_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    const syncClock = () => {
      const clientSentAt = Date.now();
      newSocket.emit(
        "time_sync",
        clientSentAt,
        (response: TimeSyncResponse) => {
          if (typeof response?.serverNow !== "number") return;

          const clientReceivedAt = Date.now();
          const roundTripTime = clientReceivedAt - clientSentAt;
          const currentBestRtt = bestClockSyncRttRef.current;

          if (currentBestRtt !== null && roundTripTime > currentBestRtt) return;

          bestClockSyncRttRef.current = roundTripTime;
          serverClockOffsetRef.current =
            response.serverNow - (clientSentAt + roundTripTime / 2);
        }
      );
    };

    const syncTimers: ReturnType<typeof setTimeout>[] = [];
    const queueClockSync = (delayMs: number) => {
      syncTimers.push(setTimeout(syncClock, delayMs));
    };

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      bestClockSyncRttRef.current = null;
      syncClock();
      queueClockSync(120);
      queueClockSync(300);
    });

    newSocket.on("connect_error", err => {
      console.error("Socket connection error:", err);
      toast.error("Server bilan ulanishda xatolik");
    });

    newSocket.on("update_room", (updatedRoom: Room) => {
      console.log("Room updated:", updatedRoom);
      setRoom(updatedRoom);
      if (updatedRoom.status !== "countdown") {
        clearStartTimer();
        setCountdownStartAt(null);
        setStatus(updatedRoom.status);
      }

      // Find opponent
      const opp = updatedRoom.players.find(p => p.socketId !== newSocket.id);
      setOpponent(opp || null);
    });

    newSocket.on("game_countdown_start", (data?: RoundStartPayload) => {
      scheduleLocalRoundStart(data);
    });

    newSocket.on("game_start", (data?: RoundStartPayload) => {
      applyRoundStart(data);
    });

    newSocket.on(
      "round_over",
      (data: {
        roundNumber: number;
        roundWinnerId: string;
        roundWinners: string[];
        scores: { userId: string; score: number }[];
      }) => {
        setStatus("countdown");
        setRoundWinners(data.roundWinners);
        setCurrentRound(data.roundNumber + 1);
        // Show toast for round result
        const isMyWin = data.roundWinnerId === user?.userId;
        toast(
          isMyWin
            ? `🏆 Raund ${data.roundNumber} - Siz yutdingiz!`
            : `💔 Raund ${data.roundNumber} - Raqib yutdi`,
          {
            duration: 2500,
          }
        );
      }
    );

    newSocket.on("error_message", (message: string) => {
      toast.error(message || "Server xatoligi");
    });

    const updateRemoteScore = ({
      userId,
      score,
      finished = false,
    }: {
      userId: string;
      score: number;
      finished?: boolean;
    }) => {
      setOpponent(prev =>
        prev && prev.userId === userId ? { ...prev, score, finished } : prev
      );
      setRoom(prev =>
        prev
          ? {
              ...prev,
              players: prev.players.map(player =>
                player.userId === userId
                  ? { ...player, score, finished: finished || player.finished }
                  : player
              ),
            }
          : prev
      );
    };

    newSocket.on("opponent_score", updateRemoteScore);

    newSocket.on(
      "player_finished_event",
      ({ userId, score }: { userId: string; score: number }) => {
        updateRemoteScore({ userId, score, finished: true });
      }
    );

    newSocket.on("player_left", ({ userId }: { userId: string }) => {
      toast.info("Raqib o'yindan chiqib ketdi");
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.filter(p => p.userId !== userId),
        };
      });
      setOpponent(null);
    });

    newSocket.on("game_aborted", () => {
      toast.warning("O'yin bekor qilindi");
      setStatus("idle");
      setRoom(null);
      setOpponent(null);
      setCountdownStartAt(null);
      clearStartTimer();
    });

    newSocket.on(
      "game_over",
      ({
        result,
        winnerId,
        roundWinners: rw,
      }: {
        result: Player[];
        winnerId: string;
        roundWinners?: string[];
      }) => {
        clearStartTimer();
        setCountdownStartAt(null);
        setStatus("finished");
        if (rw) setRoundWinners(rw);
      }
    );

    setSocket(newSocket);

    return () => {
      clearStartTimer();
      syncTimers.forEach(timer => clearTimeout(timer));
      newSocket.disconnect();
      setSocket(current => (current === newSocket ? null : current));
    };
  }, [
    user?.userId,
    user?.username,
    user?.avatar,
    applyRoundStart,
    clearStartTimer,
    scheduleLocalRoundStart,
  ]);

  const createRoom = useCallback(async (): Promise<boolean> => {
    if (!socket || !user) {
      toast.error("Serverga ulanish hali tayyor emas");
      return false;
    }

    return await new Promise<boolean>(resolve => {
      socket.emit(
        "create_room",
        {
          userId: user.userId,
          username: user.username,
          avatar: user.avatar,
        },
        (response: any) => {
          if (response?.success) {
            setRoom(response.room);
            setStatus("lobby");
            resolve(true);
            return;
          }

          toast.error("Xona yaratishda xatolik");
          resolve(false);
        }
      );
    });
  }, [socket, user]);

  const joinRoom = useCallback(
    async (code: string): Promise<boolean> => {
      if (!socket || !user) {
        toast.error("Serverga ulanish hali tayyor emas");
        return false;
      }

      return await new Promise<boolean>(resolve => {
        socket.emit(
          "join_room",
          {
            code: code.trim(),
            userProfile: {
              userId: user.userId,
              username: user.username,
              avatar: user.avatar,
            },
          },
          (response: any) => {
            if (response?.success) {
              setRoom(response.room);
              setStatus("lobby");
              resolve(true);
              return;
            }

            toast.error(response?.error || "Xonaga kirishda xatolik");
            resolve(false);
          }
        );
      });
    },
    [socket, user]
  );

  const setReady = useCallback(() => {
    if (!socket || !room) return;
    socket.emit("player_ready", room.code);
  }, [socket, room]);

  const sendScore = useCallback(
    (score: number) => {
      if (!socket || !room) return;
      socket.emit("score_update", { code: room.code, score });
    },
    [socket, room]
  );

  const finishGame = useCallback(
    (score: number) => {
      if (!socket || !room) return;
      socket.emit("player_finished", { code: room.code, score });
    },
    [socket, room]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("leave_room");
    setStatus("idle");
    setRoom(null);
    setOpponent(null);
    setCurrentRound(1);
    setTotalRounds(3);
    setRoundWinners([]);
    setCountdownStartAt(null);
    clearStartTimer();
  }, [socket, clearStartTimer]);

  return {
    status,
    room,
    opponent,
    currentRound,
    totalRounds,
    roundWinners,
    countdownStartAt,
    createRoom,
    joinRoom,
    setReady,
    sendScore,
    finishGame,
    leaveRoom,
  };
}
