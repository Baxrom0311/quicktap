// Avatar options - Kahoot-style character avatars
export const AVATAR_OPTIONS = [
    { id: 'monster', name: 'Monster', url: '/avatars/monster.png', color: '#FF4444' },
    { id: 'robot', name: 'Robot', url: '/avatars/robot.png', color: '#00D4FF' },
    { id: 'alien', name: 'Alien', url: '/avatars/alien.png', color: '#39FF14' },
    { id: 'cat', name: 'Cat', url: '/avatars/cat.png', color: '#FF9500' },
    { id: 'bear', name: 'Bear', url: '/avatars/bear.png', color: '#9D4FFF' },
    { id: 'fox', name: 'Fox', url: '/avatars/fox.png', color: '#FFD700' },
    { id: 'panda', name: 'Panda', url: '/avatars/panda.png', color: '#00CED1' },
    { id: 'unicorn', name: 'Unicorn', url: '/avatars/unicorn.png', color: '#FF1493' },
    { id: 'rocket', name: 'Rocket', url: '/avatars/rocket.png', color: '#1E3A8A' },
    { id: 'star', name: 'Star', url: '/avatars/star.png', color: '#FFD700' },
    { id: 'lightning', name: 'Lightning', url: '/avatars/lightning.png', color: '#00FFFF' },
    { id: 'trophy', name: 'Trophy', url: '/avatars/trophy.png', color: '#FFB800' },
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
