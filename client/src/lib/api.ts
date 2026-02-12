import type {
    LeaderboardResponse,
    RankResponse,
    SubmitScoreRequest,
    SubmitScoreResponse,
} from '@shared/types';

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

// Submit a score to the leaderboard
export async function submitScore(
    request: SubmitScoreRequest
): Promise<SubmitScoreResponse> {
    const response = await fetch(`${API_URL}/api/scores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
