import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '@shared/types';
import type { Difficulty } from '@/hooks/useGameState';

interface UserContextType {
    user: UserProfile | null;
    setUser: (user: UserProfile) => void;
    updateStats: (difficulty: Difficulty, score: number) => void;
    hasProfile: boolean;
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
        setUserState(newUser);
        saveUserProfile(newUser);
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
