import { motion } from 'framer-motion';
import { getAvatarById } from '@shared/types';
import type { Player } from '@/hooks/useMultiplayer';
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react';

interface MultiplayerGameOverProps {
    players: Player[];
    currentUserId: string;
    roundWinners: string[];
    totalRounds: number;
    onRematch: () => void;
    onLeave: () => void;
}

export function MultiplayerGameOver({
    players,
    currentUserId,
    roundWinners,
    totalRounds,
    onRematch,
    onLeave,
}: MultiplayerGameOverProps) {
    // Determine winner by counting round wins
    const winsCount: Record<string, number> = {};
    for (const winnerId of roundWinners) {
        winsCount[winnerId] = (winsCount[winnerId] || 0) + 1;
    }

    // Sort players by wins
    const sortedPlayers = [...players].sort((a, b) => {
        return (winsCount[b.userId] || 0) - (winsCount[a.userId] || 0);
    });

    const winnerId = sortedPlayers[0]?.userId;
    const isCurrentUserWinner = winnerId === currentUserId;
    const isDraw = sortedPlayers.length >= 2 &&
        (winsCount[sortedPlayers[0]?.userId] || 0) === (winsCount[sortedPlayers[1]?.userId] || 0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8"
        >
            {/* Result banner */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
            >
                <div className="font-display text-6xl md:text-8xl tracking-wider mb-2"
                    style={{ color: isDraw ? 'oklch(0.7 0.15 60)' : isCurrentUserWinner ? 'oklch(0.85 0.3 142)' : 'oklch(0.65 0.25 25)' }}
                >
                    {isDraw ? 'DURRANG!' : isCurrentUserWinner ? 'G\'ALABA!' : 'MAG\'LUBIYAT'}
                </div>
                <div className="text-white/40 font-display text-xl tracking-widest">
                    {isDraw ? 'Hech kim yutmadi' : isCurrentUserWinner ? 'Tabriklaymiz! 🎉' : 'Keyingisida urinib ko\'ring'}
                </div>
            </motion.div>

            {/* Player cards */}
            <div className="flex gap-6 mb-8">
                {sortedPlayers.map((player, index) => {
                    const avatar = getAvatarById(player.avatar);
                    const wins = winsCount[player.userId] || 0;
                    const isWinner = player.userId === winnerId && !isDraw;
                    const isMe = player.userId === currentUserId;

                    return (
                        <motion.div
                            key={player.userId}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.15 }}
                            className={`flex flex-col items-center gap-3 p-6 border-2 min-w-[160px] ${isWinner ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                }`}
                        >
                            {isWinner && (
                                <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
                            )}

                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center"
                                style={{ boxShadow: isWinner ? '0 0 0 3px oklch(0.85 0.3 142)' : '0 0 0 2px rgba(255,255,255,0.2)' }}
                            >
                                {avatar && <span className="text-4xl">{avatar.emoji}</span>}
                            </div>

                            <div className="text-center">
                                <div className="font-display text-xl text-white tracking-wider">
                                    {player.username}
                                    {isMe && <span className="text-primary text-sm ml-1">(Siz)</span>}
                                </div>
                                <div className="font-display text-3xl mt-1" style={{ color: isWinner ? 'oklch(0.85 0.3 142)' : 'white' }}>
                                    {wins}/{totalRounds}
                                </div>
                                <div className="text-white/40 text-sm font-display">RAUND YUTDI</div>
                            </div>

                            {/* Best score */}
                            <div className="text-white/50 text-sm font-display">
                                Eng yaxshi: {player.score}ms
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Round results */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-8 flex gap-2"
            >
                {roundWinners.map((winnerId, i) => {
                    const roundWinner = players.find(p => p.userId === winnerId);
                    const isMyWin = winnerId === currentUserId;
                    return (
                        <div
                            key={i}
                            className={`flex flex-col items-center gap-1 px-4 py-2 border-2 ${isMyWin ? 'border-primary bg-primary/10' : 'border-border bg-card'
                                }`}
                        >
                            <div className="text-xs text-white/40 font-display">R{i + 1}</div>
                            <div className="font-display text-sm" style={{ color: isMyWin ? 'oklch(0.85 0.3 142)' : 'oklch(0.65 0.25 25)' }}>
                                {isMyWin ? '✓' : '✗'}
                            </div>
                            <div className="text-xs text-white/30 font-display">
                                {roundWinner?.username?.slice(0, 6) || '?'}
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex gap-4"
            >
                <button
                    onClick={onRematch}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-black font-display text-xl tracking-wider hover:bg-primary/90 transition-colors"
                >
                    <RotateCcw className="w-5 h-5" /> REMATCH
                </button>
                <button
                    onClick={onLeave}
                    className="flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white/30 text-white/60 font-display text-xl tracking-wider hover:border-white hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> CHIQISH
                </button>
            </motion.div>
        </motion.div>
    );
}
