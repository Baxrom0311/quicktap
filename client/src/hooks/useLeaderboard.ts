import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '@shared/types';
import type { Difficulty } from './useGameState';
import { getLeaderboard, getUserRank, submitScore, type LeaderboardPeriod } from '@/lib/api';
import type { UserProfile } from '@shared/types';

interface UseLeaderboardReturn {
    leaderboard: LeaderboardEntry[];
    loading: boolean;
    error: string | null;
    userRank: number | null;
    total: number;
    fetchLeaderboard: () => Promise<void>;
    submitUserScore: (score: number, user: UserProfile) => Promise<void>;
}

export function useLeaderboard(
    difficulty: Difficulty,
    period: LeaderboardPeriod = 'all',
): UseLeaderboardReturn {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [total, setTotal] = useState(0);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getLeaderboard(difficulty, 50, period);
            setLeaderboard(data.leaderboard);
            setTotal(data.total || data.leaderboard.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'O\'qishda xatolik');
        } finally {
            setLoading(false);
        }
    }, [difficulty, period]);

    const fetchUserRank = useCallback(
        async (userId: string) => {
            try {
                const data = await getUserRank(userId, difficulty);
                setUserRank(data.rank);
            } catch (err) {
                console.error('Failed to fetch user rank:', err);
            }
        },
        [difficulty]
    );

    const submitUserScore = useCallback(
        async (score: number, user: UserProfile) => {
            try {
                await submitScore({
                    username: user.username,
                    avatar: user.avatar,
                    score,
                    difficulty,
                });

                // Refetch leaderboard after submission
                await fetchLeaderboard();
                await fetchUserRank(user.userId);
            } catch (err) {
                throw err;
            }
        },
        [difficulty, fetchLeaderboard, fetchUserRank]
    );

    // Auto-fetch on mount and difficulty change
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        leaderboard,
        loading,
        error,
        userRank,
        total,
        fetchLeaderboard,
        submitUserScore,
    };
}
