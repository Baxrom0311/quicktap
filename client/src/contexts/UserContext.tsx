import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '@shared/types';
import type { Difficulty } from '@/hooks/useGameState';
import { login, getUserRank } from '@/lib/api';

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

    // Login when user is set or loaded
    useEffect(() => {
        if (user?.userId) {
            login(user.userId)
                .then(() => {
                    console.log('Logged in successfully');
                    syncStats();
                })
                .catch(err => console.error('Login failed:', err));
        }
    }, [user?.userId]);

    const setUser = (newUser: UserProfile) => {
        setUserState(newUser);
        saveUserProfile(newUser);
    };

    const syncStats = async () => {
        if (!user) return;
        try {
            const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
            const updates: Partial<UserProfile['stats']> = {};

            for (const diff of difficulties) {
                const { best_score } = await getUserRank(user.userId, diff);
                if (best_score !== null) {
                    updates[diff] = {
                        ...user.stats[diff],
                        bestScore: best_score
                    };
                } else {
                    updates[diff] = user.stats[diff];
                }
            }

            const updatedUser = {
                ...user,
                stats: {
                    ...user.stats,
                    ...updates
                }
            };

            // Only update if changed to avoid loops
            if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to sync stats:', error);
        }
    };

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
