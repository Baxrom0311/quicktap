-- QuickTap Leaderboard Database Schema

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 50 AND score <= 10000),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_difficulty_score ON leaderboard(difficulty, score ASC);
CREATE INDEX IF NOT EXISTS idx_user_difficulty ON leaderboard(user_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_created_at ON leaderboard(created_at DESC);
-- Supports DISTINCT ON / grouped best-score leaderboard queries without a wide sort.
CREATE INDEX IF NOT EXISTS idx_leaderboard_best_user_score
  ON leaderboard(difficulty, user_id, score ASC, created_at ASC);

-- Optional: Create a view for best scores per user
CREATE OR REPLACE VIEW user_best_scores AS
SELECT DISTINCT ON (user_id, difficulty)
  user_id,
  username,
  avatar,
  score,
  difficulty,
  created_at
FROM leaderboard
ORDER BY user_id, difficulty, score ASC, created_at ASC;
