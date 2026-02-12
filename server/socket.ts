import { Server, Socket } from 'socket.io';
import { randomInt } from 'crypto';

interface Player {
    socketId: string;
    userId: string;
    username: string;
    avatar: string; // avatar id
    score: number;
    isReady: boolean;
    finished: boolean;
    lastActionTime: number; // For rate limiting
}

interface Room {
    code: string;
    players: Player[];
    status: 'lobby' | 'countdown' | 'playing' | 'finished';
    createdAt: number;
    startTime?: number; // Timestamp when the "GO" signal was sent
    // Best-of-3 fields
    currentRound: number;   // 1-based
    totalRounds: number;    // 3
    roundWinners: string[]; // userId of each round's winner
}

const rooms = new Map<string, Room>();

// Map to quickly find which room a socket belongs to (O(1) lookup)
const socketToRoom = new Map<string, string>();

// Helper to generate 6-digit code
function generateRoomCode(): string {
    let code = '';
    do {
        code = randomInt(100000, 999999).toString();
    } while (rooms.has(code));
    return code;
}

export function setupSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Create Room
        socket.on('create_room', (userProfile: { userId: string; username: string; avatar: string }, callback) => {
            const code = generateRoomCode();

            const player: Player = {
                socketId: socket.id,
                userId: userProfile.userId,
                username: userProfile.username,
                avatar: userProfile.avatar,
                score: 0,
                isReady: false,
                finished: false,
                lastActionTime: Date.now()
            };

            const room: Room = {
                code,
                players: [player],
                status: 'lobby',
                createdAt: Date.now(),
                currentRound: 1,
                totalRounds: 3,
                roundWinners: []
            };

            rooms.set(code, room);
            socketToRoom.set(socket.id, code);
            socket.join(code);

            callback({ success: true, code, room });
            console.log(`Room created: ${code} by ${userProfile.username}`);
        });

        // Join Room
        socket.on('join_room', ({ code, userProfile }: { code: string; userProfile: any }, callback) => {
            const room = rooms.get(code);

            if (!room) {
                return callback({ success: false, error: 'Room not found' });
            }

            if (room.status !== 'lobby') {
                return callback({ success: false, error: 'Game already in progress' });
            }

            if (room.players.length >= 2) {
                return callback({ success: false, error: 'Room is full' });
            }

            const player: Player = {
                socketId: socket.id,
                userId: userProfile.userId,
                username: userProfile.username,
                avatar: userProfile.avatar,
                score: 0,
                isReady: false,
                finished: false,
                lastActionTime: Date.now()
            };

            room.players.push(player);
            socketToRoom.set(socket.id, code);
            socket.join(code);

            // Notify everyone in room (including sender) that player joined
            io.to(code).emit('update_room', room);

            callback({ success: true, room });
            console.log(`User ${userProfile.username} joined room ${code}`);
        });

        // Player Ready
        socket.on('player_ready', (code: string) => {
            const room = rooms.get(code);
            if (!room) return;

            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                player.isReady = true;

                // Notify update
                io.to(code).emit('update_room', room);

                // Check if all players ready (must be 2 players)
                if (room.players.length === 2 && room.players.every(p => p.isReady)) {
                    room.status = 'countdown';
                    io.to(code).emit('game_countdown_start');

                    // Start game after 3 seconds
                    setTimeout(() => {
                        if (rooms.has(code)) {
                            const currentRoom = rooms.get(code);
                            if (currentRoom) {
                                currentRoom.status = 'playing';
                                currentRoom.startTime = Date.now();
                                io.to(code).emit('game_start');
                            }
                        }
                    }, 3000);
                }
            }
        });

        // Score Update
        socket.on('score_update', ({ code, score }: { code: string; score: number }) => {
            const room = rooms.get(code);
            if (!room || room.status !== 'playing') return;

            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                player.score = score;
                // Broadcast score update to opponent (or everyone)
                socket.to(code).emit('opponent_score', { userId: player.userId, score });
            }
        });

        // Game Finished (Player finished)
        socket.on('player_finished', ({ code, score }: { code: string; score: number }) => {
            const room = rooms.get(code);
            if (!room || room.status !== 'playing') return;

            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                // Rate Limiting: Prevent spamming events
                const now = Date.now();
                if (now - player.lastActionTime < 200) {
                    console.warn(`Rate limit exceeded for ${player.username}`);
                    // Simply ignore if spamming too fast
                    return;
                }
                player.lastActionTime = now;

                // Anti-Cheat: Validate score
                const MIN_HUMAN_REACTION_TIME = 100; // ms

                // Check 1: Impossible human reaction time
                if (score < MIN_HUMAN_REACTION_TIME) {
                    console.warn(`CHEAT DETECTED: Impossible reaction time ${score}ms from ${player.username}`);
                    socket.emit('error_message', 'CHEAT DETECTED: Impossible reaction time');
                    socket.disconnect(true);
                    return;
                }

                // Check 2: Server-side delta validation (if startTime exists)
                if (room.startTime) {
                    const serverDelta = Date.now() - room.startTime;
                    // The claimed score MUST be <= serverDelta (allowing for small clock drift/processing time)
                    // serverDelta = ReactionTime + RTT + Processing
                    // So ReactionTime <= serverDelta
                    // We add a small buffer (e.g. 100ms) just in case of weird clock sync issues, though Date.now() is server-side.
                    // Wait, Date.now() is server time.

                    if (score > serverDelta + 200) {
                        console.warn(`Timetravel detected? Score: ${score}, ServerDelta: ${serverDelta}`);
                        // This usually means the client clock is way off or they are cheating by sending a timestamp?
                        // No, they send a duration. If duration > serverDelta, they claim they reacted longer than the game has been running?
                        // That's actually "honest" lag, not cheating. Cheating is usually SMALLER score.
                        // So this check is less critical for "too fast" cheating.
                    }

                    // Check 3: Max Lag Tolerance (The "Hold Back" attack)
                    // If user waits 1s (real) but sends "150ms" (fake), the packet arrives at T=1000+RTT.
                    // serverDelta = 1000+. Score = 150.
                    // Diff = 850ms. This looks like HUGE lag.
                    // We set a threshold. If implied lag is > 400ms, it's either unplayable internet or cheating.
                    const impliedLag = serverDelta - score;
                    if (impliedLag > 400) {
                        console.warn(`Suspicious lag detected: ${player.username} (Lag: ${impliedLag}ms)`);

                        if (impliedLag > 800) {
                            console.warn(`CHEAT DETECTED: Review lag tolerance exceeded (${impliedLag}ms) for ${player.username}`);
                            socket.emit('error_message', 'Connection too unstable or manipulation detected');
                            socket.disconnect(true);
                            return;
                        }
                    }
                }

                player.finished = true;
                player.score = score; // Final score

                // Notify others
                io.to(code).emit('player_finished_event', { userId: player.userId, score });

                // Check if all finished
                if (room.players.every(p => p.finished)) {
                    // Determine round winner (lower score = better)
                    const sortedPlayers = [...room.players].sort((a, b) => a.score - b.score);
                    const roundWinner = sortedPlayers[0];
                    room.roundWinners.push(roundWinner.userId);

                    // Count wins
                    const winsNeeded = Math.ceil(room.totalRounds / 2); // 2 for best-of-3
                    const player1Wins = room.roundWinners.filter(id => id === room.players[0].userId).length;
                    const player2Wins = room.roundWinners.filter(id => id === room.players[1].userId).length;

                    if (player1Wins >= winsNeeded || player2Wins >= winsNeeded) {
                        // Match is over
                        room.status = 'finished';
                        const matchWinnerId = player1Wins >= winsNeeded ? room.players[0].userId : room.players[1].userId;

                        io.to(code).emit('game_over', {
                            result: room.players,
                            winnerId: matchWinnerId,
                            roundWinners: room.roundWinners,
                            currentRound: room.currentRound,
                            totalRounds: room.totalRounds
                        });
                    } else {
                        // More rounds to play - emit round result, then prepare next round
                        io.to(code).emit('round_over', {
                            roundNumber: room.currentRound,
                            roundWinnerId: roundWinner.userId,
                            roundWinners: room.roundWinners,
                            scores: room.players.map(p => ({ userId: p.userId, score: p.score }))
                        });

                        // Reset for next round after a brief delay
                        room.currentRound++;
                        room.players.forEach(p => {
                            p.score = 0;
                            p.finished = false;
                        });

                        // Auto-start next round after 3 seconds
                        setTimeout(() => {
                            if (rooms.has(code)) {
                                const currentRoom = rooms.get(code);
                                if (currentRoom && currentRoom.status !== 'finished') {
                                    currentRoom.status = 'playing';
                                    currentRoom.startTime = Date.now();
                                    io.to(code).emit('game_start', {
                                        round: currentRoom.currentRound,
                                        totalRounds: currentRoom.totalRounds
                                    });
                                }
                            }
                        }, 3000);
                    }
                }
            }
        });

        // Leave Room / Disconnect
        const handleLeave = () => {
            const code = socketToRoom.get(socket.id);
            if (!code) return; // Socket was not in any room

            const room = rooms.get(code);
            if (!room) {
                socketToRoom.delete(socket.id);
                return;
            }

            const index = room.players.findIndex((p: Player) => p.socketId === socket.id);
            if (index !== -1) {
                const player = room.players[index];
                room.players.splice(index, 1);
                socketToRoom.delete(socket.id);

                if (room.players.length === 0) {
                    rooms.delete(code);
                } else {
                    io.to(code).emit('player_left', { userId: player.userId });

                    // Specific handling based on game state
                    if (room.status === 'playing' || room.status === 'countdown') {
                        // Instead of just aborting, the remaining player wins by default!
                        const remainingPlayer = room.players[0];
                        room.status = 'finished';

                        io.to(code).emit('game_over', {
                            result: room.players,
                            winnerId: remainingPlayer.userId,
                            reason: 'opponent_disconnected' // Client can use this to show a specific message
                        });
                    } else {
                        // Lobby state - just update room
                        room.players.forEach((p: Player) => {
                            p.isReady = false;
                        });
                        io.to(code).emit('update_room', room);
                    }
                }
            }
        };

        socket.on('leave_room', handleLeave);
        socket.on('disconnect', handleLeave);
    });
}
