import type {
    LeaderboardResponse,
    RankResponse,
    SubmitScoreRequest,
    SubmitScoreResponse,
    LoginRequest,
    LoginResponse,
} from '@shared/types';

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

// Token management
let accessToken: string | null = localStorage.getItem('quicktap_token');

export function setToken(token: string) {
    accessToken = token;
    localStorage.setItem('quicktap_token', token);
}

export function getToken(): string | null {
    return accessToken;
}

// Login to get token
export async function login(userId: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }

    const data: LoginResponse = await response.json();
    setToken(data.accessToken);
    return data;
}

// Submit a score to the leaderboard
export async function submitScore(
    request: SubmitScoreRequest
): Promise<SubmitScoreResponse> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}/api/scores`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit score');
    }

    return response.json();
}

// Get leaderboard for a difficulty
export async function getLeaderboard(
    difficulty: 'easy' | 'normal' | 'hard',
    limit: number = 100
): Promise<LeaderboardResponse> {
    const response = await fetch(
        `${API_URL}/api/leaderboard/${difficulty}?limit=${limit}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
    }

    return response.json();
}

// Get user's rank for a difficulty
export async function getUserRank(
    userId: string,
    difficulty: 'easy' | 'normal' | 'hard'
): Promise<RankResponse> {
    const response = await fetch(
        `${API_URL}/api/user/${userId}/rank/${difficulty}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch user rank');
    }

    return response.json();
}
