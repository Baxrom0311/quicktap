import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { UserProfile } from '@shared/types';
import { toast } from 'sonner';

// Determine API URL (should match the backend)
const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

export type MultiplayerStatus = 'idle' | 'lobby' | 'countdown' | 'playing' | 'finished';

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
    const [status, setStatus] = useState<MultiplayerStatus>('idle');
    const [room, setRoom] = useState<Room | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [opponent, setOpponent] = useState<Player | null>(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [roundWinners, setRoundWinners] = useState<string[]>([]);

    useEffect(() => {
        if (user) return;
        setStatus('idle');
        setRoom(null);
        setOpponent(null);
        setSocket(null);
        setCurrentRound(1);
        setRoundWinners([]);
    }, [user]);

    // Initialize socket connection
    useEffect(() => {
        if (!user) return;

        console.log('Connecting to socket at:', API_URL);
        const newSocket = io(API_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            toast.error('Server bilan ulanishda xatolik');
        });

        newSocket.on('update_room', (updatedRoom: Room) => {
            console.log('Room updated:', updatedRoom);
            setRoom(updatedRoom);
            setStatus(updatedRoom.status);

            // Find opponent
            const opp = updatedRoom.players.find(p => p.socketId !== newSocket.id);
            setOpponent(opp || null);
        });

        newSocket.on('game_countdown_start', () => {
            // Handled via update_room usually, but good for specific effects
            setStatus('countdown');
        });

        newSocket.on('game_start', (data?: { round?: number; totalRounds?: number }) => {
            setStatus('playing');
            if (data?.round) setCurrentRound(data.round);
            if (data?.totalRounds) setTotalRounds(data.totalRounds);
        });

        newSocket.on('round_over', (data: { roundNumber: number; roundWinnerId: string; roundWinners: string[]; scores: { userId: string; score: number }[] }) => {
            setRoundWinners(data.roundWinners);
            // Show toast for round result
            const isMyWin = data.roundWinnerId === user?.userId;
            toast(isMyWin ? `🏆 Raund ${data.roundNumber} - Siz yutdingiz!` : `💔 Raund ${data.roundNumber} - Raqib yutdi`, {
                duration: 2500,
            });
        });

        newSocket.on('opponent_score', ({ userId, score }: { userId: string, score: number }) => {
            setOpponent(prev => prev ? { ...prev, score } : null);
        });

        newSocket.on('player_left', ({ userId }: { userId: string }) => {
            toast.info('Raqib o\'yindan chiqib ketdi');
            setRoom(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    players: prev.players.filter(p => p.userId !== userId)
                };
            });
            setOpponent(null);
        });

        newSocket.on('game_aborted', () => {
            toast.warning('O\'yin bekor qilindi');
            setStatus('idle');
            setRoom(null);
            setOpponent(null);
        });

        newSocket.on('game_over', ({ result, winnerId, roundWinners: rw }: { result: Player[], winnerId: string, roundWinners?: string[] }) => {
            setStatus('finished');
            if (rw) setRoundWinners(rw);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket((current) => (current === newSocket ? null : current));
        };
    }, [user?.userId, user?.username, user?.avatar]);

    const createRoom = useCallback(async (): Promise<boolean> => {
        if (!socket || !user) {
            toast.error('Serverga ulanish hali tayyor emas');
            return false;
        }

        return await new Promise<boolean>((resolve) => {
            socket.emit(
                'create_room',
                {
                    userId: user.userId,
                    username: user.username,
                    avatar: user.avatar,
                },
                (response: any) => {
                    if (response?.success) {
                        setRoom(response.room);
                        setStatus('lobby');
                        resolve(true);
                        return;
                    }

                    toast.error('Xona yaratishda xatolik');
                    resolve(false);
                }
            );
        });
    }, [socket, user]);

    const joinRoom = useCallback(async (code: string): Promise<boolean> => {
        if (!socket || !user) {
            toast.error('Serverga ulanish hali tayyor emas');
            return false;
        }

        return await new Promise<boolean>((resolve) => {
            socket.emit(
                'join_room',
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
                        setStatus('lobby');
                        resolve(true);
                        return;
                    }

                    toast.error(response?.error || 'Xonaga kirishda xatolik');
                    resolve(false);
                }
            );
        });
    }, [socket, user]);

    const setReady = useCallback(() => {
        if (!socket || !room) return;
        socket.emit('player_ready', room.code);
    }, [socket, room]);

    const sendScore = useCallback((score: number) => {
        if (!socket || !room) return;
        socket.emit('score_update', { code: room.code, score });
    }, [socket, room]);

    const finishGame = useCallback((score: number) => {
        if (!socket || !room) return;
        socket.emit('player_finished', { code: room.code, score });
    }, [socket, room]);

    const leaveRoom = useCallback(() => {
        if (!socket) return;
        socket.emit('leave_room');
        setStatus('idle');
        setRoom(null);
        setOpponent(null);
    }, [socket]);

    return {
        status,
        room,
        opponent,
        currentRound,
        totalRounds,
        roundWinners,
        createRoom,
        joinRoom,
        setReady,
        sendScore,
        finishGame,
        leaveRoom
    };
}
