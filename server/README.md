# QuickTap API Server

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

For Docker full-stack runs, set:
- `CORS_ORIGIN_DOCKER=http://localhost:3001,http://localhost:5173`
- `GUEST_TOKEN_TTL_SECONDS=2592000` (optional)

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev:api
```

## Docker Setup

```bash
# Build and run full stack
docker compose up --build -d

# Check API health
curl http://localhost:3001/api/health
```

## API Endpoints

### POST /api/auth/guest
Create an anonymous guest session token.

**Response:**
```json
{
  "accessToken": "<jwt>",
  "playerId": "f0b9b48d5a3f4a7db31f08d62c2a7c1e",
  "expiresInSeconds": 2592000
}
```

### POST /api/scores
Submit a new score to the leaderboard.

`Authorization: Bearer <accessToken>` is required.  
`user_id` is derived from the token on the server side.

**Request:**
```json
{
  "username": "Player123",
  "avatar": "😀",
  "score": 150,
  "difficulty": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid",
  "created_at": "2026-01-28T00:00:00Z"
}
```

### GET /api/leaderboard/:difficulty
Get top 100 scores for a difficulty level.

If `Authorization: Bearer <accessToken>` is provided, each row includes `is_me`.

**Response:**
```json
{
  "leaderboard": [
    {
      "id": "uuid",
      "username": "Player123",
      "avatar": "😀",
      "score": 150,
      "created_at": "2026-01-28T00:00:00Z",
      "is_me": true
    }
  ]
}
```

### GET /api/user/:userId/rank/:difficulty
Get user's rank and best score for a difficulty.

**Response:**
```json
{
  "rank": 47,
  "best_score": 250
}
```
