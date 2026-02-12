# QuickTap API Server

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev:api
```

## Docker Setup

```bash
# Start PostgreSQL
docker-compose up -d

# Run migrations
psql -h localhost -U postgres -d quicktap -f server/schema.sql
```

## API Endpoints

### POST /api/scores
Submit a new score to the leaderboard.

**Request:**
```json
{
  "user_id": "uuid",
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

**Response:**
```json
{
  "leaderboard": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "username": "Player123",
      "avatar": "😀",
      "score": 150,
      "created_at": "2026-01-28T00:00:00Z"
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
