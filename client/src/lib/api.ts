import type {
    LeaderboardResponse,
    RankResponse,
    SubmitScoreRequest,
    SubmitScoreResponse,
    GuestSessionResponse,
} from '@shared/types';

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

// Token management
const TOKEN_KEY = 'quicktap_token';
const PLAYER_ID_KEY = 'quicktap_player_id';

let accessToken: string | null = localStorage.getItem(TOKEN_KEY);
let playerId: string | null = localStorage.getItem(PLAYER_ID_KEY);

function setSession(session: GuestSessionResponse) {
    accessToken = session.accessToken;
    playerId = session.playerId;
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(PLAYER_ID_KEY, session.playerId);
}

export function setToken(token: string) {
    accessToken = token;
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    return accessToken;
}

export function getPlayerId(): string | null {
    return playerId;
}

// Create or refresh an anonymous guest session.
export async function ensureGuestSession(forceRefresh = false): Promise<GuestSessionResponse> {
    if (!forceRefresh && accessToken && playerId) {
        return {
            accessToken,
            playerId,
            expiresInSeconds: 0,
        };
    }

    const response = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to create guest session');
    }

    const data: GuestSessionResponse = await response.json();
    setSession(data);
    return data;
}

// Backward-compatible alias used by older code paths.
export async function login(): Promise<GuestSessionResponse> {
    return ensureGuestSession(false);
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const error = await response.json();
        if (error && typeof error.error === 'string') {
            return error.error;
        }
    } catch {
        // ignore JSON parsing issues and use fallback message
    }
    return fallback;
}

// Submit a score to the leaderboard
export async function submitScore(
    request: SubmitScoreRequest
): Promise<SubmitScoreResponse> {
    if (!accessToken || !playerId) {
        await ensureGuestSession(false);
    }

    const sendRequest = async () => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return fetch(`${API_URL}/api/scores`, {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
        });
    };

    let response = await sendRequest();

    if (response.status === 401 || response.status === 403) {
        await ensureGuestSession(true);
        response = await sendRequest();
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'Failed to submit score'));
    }

    return response.json();
}

// Get leaderboard for a difficulty
export type LeaderboardPeriod = 'all' | 'today' | 'week' | 'month';

export async function getLeaderboard(
    difficulty: 'easy' | 'normal' | 'hard',
    limit: number = 50,
    period: LeaderboardPeriod = 'all',
    offset: number = 0,
): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({
        limit: String(limit),
        period,
        offset: String(offset),
    });
    const headers: HeadersInit = {};
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
        `${API_URL}/api/leaderboard/${difficulty}?${params}`,
        { headers }
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
