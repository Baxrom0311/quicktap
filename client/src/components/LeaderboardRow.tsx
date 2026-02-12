import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '@shared/types';
import { getAvatarById } from '@shared/types';

interface LeaderboardRowProps {
    rank: number;
    entry: LeaderboardEntry;
    isCurrentUser: boolean;
}

export function LeaderboardRow({ rank, entry, isCurrentUser }: LeaderboardRowProps) {
    const getMedalEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return null;
    };

    const medal = getMedalEmoji(rank);
    const avatarData = getAvatarById(entry.avatar);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rank * 0.02 }}
            className={`flex items-center gap-3 p-3 border-2 transition-colors ${isCurrentUser
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/30'
                }`}
        >
            {/* Rank */}
            <div className="w-12 text-center font-display text-xl">
                {medal ? (
                    <span className="text-2xl">{medal}</span>
                ) : (
                    <span className="text-muted-foreground">#{rank}</span>
                )}
            </div>

            {/* Avatar */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-border flex-shrink-0">
                {avatarData ? (
                    <img
                        src={avatarData.url}
                        alt={avatarData.name}
                        className="w-full h-full object-contain p-1"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                        ❓
                    </div>
                )}
            </div>

            {/* Username */}
            <div className="flex-1 min-w-0">
                <div className="font-display tracking-wider text-white truncate">
                    {entry.username}
                    {isCurrentUser && (
                        <span className="ml-2 text-primary text-sm">(Siz)</span>
                    )}
                </div>
            </div>

            {/* Score */}
            <div className="font-display text-2xl text-primary">
                {entry.score}
                <span className="text-sm text-muted-foreground ml-1">ms</span>
            </div>
        </motion.div>
    );
}
