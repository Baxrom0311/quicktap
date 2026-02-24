// Avatar options - Emoji-based character avatars
export const AVATAR_OPTIONS = [
    { id: 'monster', name: 'Monster', emoji: '👾', color: '#FF4444' },
    { id: 'robot', name: 'Robot', emoji: '🤖', color: '#00D4FF' },
    { id: 'alien', name: 'Alien', emoji: '👽', color: '#39FF14' },
    { id: 'cat', name: 'Cat', emoji: '🐱', color: '#FF9500' },
    { id: 'bear', name: 'Bear', emoji: '🐻', color: '#9D4FFF' },
    { id: 'fox', name: 'Fox', emoji: '🦊', color: '#FFD700' },
    { id: 'panda', name: 'Panda', emoji: '🐼', color: '#00CED1' },
    { id: 'unicorn', name: 'Unicorn', emoji: '🦄', color: '#FF1493' },
    { id: 'rocket', name: 'Rocket', emoji: '🚀', color: '#1E3A8A' },
    { id: 'star', name: 'Star', emoji: '⭐', color: '#FFD700' },
    { id: 'lightning', name: 'Lightning', emoji: '⚡', color: '#00FFFF' },
    { id: 'trophy', name: 'Trophy', emoji: '🏆', color: '#FFB800' },
] as const;

export type AvatarId = typeof AVATAR_OPTIONS[number]['id'];
export type AvatarOption = typeof AVATAR_OPTIONS[number];

// Helper to get avatar by ID
export function getAvatarById(id: string): AvatarOption | undefined {
    return AVATAR_OPTIONS.find(avatar => avatar.id === id);
}

// User profile interface
export interface UserProfile {
    userId: string;
    username: string;
    avatar: string; // avatar ID
    createdAt: string;
    stats: {
        easy: { games: number; bestScore: number | null };
        normal: { games: number; bestScore: number | null };
        hard: { games: number; bestScore: number | null };
    };
}

// Leaderboard entry interface
export interface LeaderboardEntry {
    id: string;
    user_id: string;
    username: string;
    avatar: string;
    score: number;
    created_at: string;
}

// API response types
export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    total?: number;
    limit?: number;
    offset?: number;
    period?: string;
}

export interface RankResponse {
    rank: number | null;
    best_score: number | null;
}

export interface SubmitScoreRequest {
    user_id: string;
    username: string;
    avatar: string;
    score: number;
    difficulty: 'easy' | 'normal' | 'hard';
}

export interface SubmitScoreResponse {
    success: boolean;
    id: string;
    created_at: string;
}

export interface LoginRequest {
    userId: string;
}

export interface LoginResponse {
    accessToken: string;
}
