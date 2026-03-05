import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '@shared/types';
import type { Difficulty } from '@/hooks/useGameState';
import { ensureGuestSession, getPlayerId, getUserRank } from '@/lib/api';

interface UserContextType {
    user: UserProfile | null;
    setUser: (user: UserProfile) => void;
    updateStats: (difficulty: Difficulty, score: number) => void;
    hasProfile: boolean;
    syncStats: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'quicktap_user_profile';

function loadUserProfile(): UserProfile | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
    return null;
}

function saveUserProfile(user: UserProfile) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Failed to save user profile:', error);
    }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<UserProfile | null>(() => loadUserProfile());

    const setUser = (newUser: UserProfile) => {
        const sessionPlayerId = getPlayerId();
        const normalizedUser = sessionPlayerId
            ? { ...newUser, userId: sessionPlayerId }
            : newUser;

        setUserState(normalizedUser);
        saveUserProfile(normalizedUser);
    };

    const syncStatsForUser = async (targetUser: UserProfile) => {
        try {
            const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
            const updates: Partial<UserProfile['stats']> = {};

            for (const diff of difficulties) {
                const { best_score } = await getUserRank(targetUser.userId, diff);
                if (best_score !== null) {
                    updates[diff] = {
                        ...targetUser.stats[diff],
                        bestScore: best_score
                    };
                } else {
                    updates[diff] = targetUser.stats[diff];
                }
            }

            const updatedUser = {
                ...targetUser,
                stats: {
                    ...targetUser.stats,
                    ...updates
                }
            };

            // Only update if changed to avoid loops
            if (JSON.stringify(updatedUser) !== JSON.stringify(targetUser)) {
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to sync stats:', error);
        }
    };

    const syncStats = async () => {
        if (!user) return;
        await syncStatsForUser(user);
    };

    // Ensure anonymous server session exists and align local profile userId with server-issued playerId.
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        const bootstrapSession = async () => {
            try {
                const session = await ensureGuestSession(false);
                if (cancelled) return;

                if (session.playerId !== user.userId) {
                    setUser({ ...user, userId: session.playerId });
                    return;
                }

                await syncStatsForUser(user);
            } catch (err) {
                console.error('Failed to initialize guest session:', err);
            }
        };

        bootstrapSession();

        return () => {
            cancelled = true;
        };
    }, [user?.userId]);

    const updateStats = (difficulty: Difficulty, score: number) => {
        if (!user) return;

        const updatedUser: UserProfile = {
            ...user,
            stats: {
                ...user.stats,
                [difficulty]: {
                    games: user.stats[difficulty].games + 1,
                    bestScore:
                        user.stats[difficulty].bestScore === null
                            ? score
                            : Math.min(user.stats[difficulty].bestScore, score),
                },
            },
        };

        setUser(updatedUser);
    };

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                updateStats,
                hasProfile: user !== null,
                syncStats,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
