import { motion } from 'framer-motion';
import { getAvatarById } from '@shared/types';
import type { Room, Player } from '@/hooks/useMultiplayer';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyProps {
    room: Room;
    currentUserSocketId: string;
    onReady: () => void;
    onLeave: () => void;
}

export function Lobby({ room, currentUserSocketId, onReady, onLeave }: LobbyProps) {
    const handleCopyCode = () => {
        // Copy link if available, otherwise just code
        const origin = window.location.origin;
        const link = `${origin}/join/${room.code}`;
        navigator.clipboard.writeText(link);
        toast.success('Taklif havolasi nusxalandi');
    };

    const currentPlayer = room.players.find(p => p.socketId === currentUserSocketId);
    const opponent = room.players.find(p => p.socketId !== currentUserSocketId);

    // Player Card Component
    const PlayerCard = ({ player, label }: { player?: Player, label: string }) => {
        const avatar = player ? getAvatarById(player.avatar) : null;

        return (
            <div className={`
                flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all w-full
                ${player
                    ? (player.isReady
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-white/20')
                    : 'bg-white/5 border-dashed border-white/10'
                }
            `}>
                <div className="font-display text-sm text-white/40 tracking-widest mb-2">{label}</div>

                {player ? (
                    <>
                        <div className="w-24 h-24 rounded-full bg-white/10 p-1 ring-2 ring-white/20">
                            {avatar && (
                                <img
                                    src={avatar.url}
                                    alt={avatar.name}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                        <div className="text-center">
                            <div className="font-display text-xl text-white tracking-wider">{player.username}</div>
                            <div className={`mt-2 font-display text-sm tracking-widest ${player.isReady ? 'text-primary' : 'text-white/40'}`}>
                                {player.isReady ? 'TAYYOR' : 'KUTILMOQDA...'}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                        <div className="text-4xl">?</div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-8"
        >
            {/* Header / Room Code */}
            <div className="text-center mb-12">
                <div className="text-white/40 font-display text-sm tracking-widest mb-2">XONA KODI (HAVOLA)</div>
                <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-3 text-5xl sm:text-7xl font-display text-primary tracking-widest hover:scale-105 transition-transform"
                >
                    {room.code}
                    <Copy className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
                </button>
                <div className="text-white/20 text-xs mt-2 font-display tracking-widest">
                    HAVOLANI NUSXALASH UCHUN BOSING
                </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                <PlayerCard player={currentPlayer} label="SIZ" />
                <PlayerCard player={opponent} label="RAQIB" />
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full max-w-md">
                <button
                    onClick={onLeave}
                    className="flex-1 py-4 bg-white/10 text-white font-display text-xl tracking-wider hover:bg-white/20 transition-colors"
                >
                    CHIQISH
                </button>
                <button
                    onClick={onReady}
                    disabled={currentPlayer?.isReady}
                    className={`
                        flex-1 py-4 font-display text-xl tracking-wider transition-all
                        ${currentPlayer?.isReady
                            ? 'bg-primary/20 text-primary cursor-default'
                            : 'bg-primary text-black hover:bg-primary/90'
                        }
                    `}
                >
                    {currentPlayer?.isReady ? 'KUTILMOQDA...' : 'TAYYOR'}
                </button>
            </div>

            {/* Status Message */}
            <div className="mt-8 h-8 text-center font-display tracking-widest text-primary animate-pulse">
                {room.players.length < 2 && "Raqib ulanishi kutilmoqda..."}
                {room.players.length === 2 && !room.players.every(p => p.isReady) && "O'yinchilar tayyor bo'lishi kutilmoqda..."}
                {room.players.every(p => p.isReady) && "O'yin boshlanmoqda..."}
            </div>
        </motion.div>
    );
}
