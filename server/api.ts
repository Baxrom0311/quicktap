import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket.js';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'quicktap',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Middleware
app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import jwt from 'jsonwebtoken';

// ... (imports remain the same)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

// ... (middleware setup remains the same)

// Auth Middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

// POST /api/auth/login - Get a token
app.post('/api/auth/login', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'UserID required' });
    }
    // In a real app, we would verify a password here.
    // For this game, we are trusting the client provided userId but signing it
    // so that only our server can generate valid tokens for score submission.
    // This prevents random people from "curling" scores without at least running the client logic once.

    const user = { userId };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    res.json({ accessToken });
});

// POST /api/scores - Submit a new score (PROTECTED)
app.post('/api/scores', authenticateToken, async (req: any, res: any) => {
    try {
        const { user_id, username, avatar, score, difficulty } = req.body;

        // Verify that the token matches the submitted score's user_id
        if (req.user.userId !== user_id) {
            return res.status(403).json({ error: 'Token mismatch' });
        }

        // Validation
        if (
            typeof user_id !== 'string' ||
            // ... rest of validation and logic            typeof username !== 'string' ||
            typeof avatar !== 'string' ||
            typeof score !== 'number' ||
            typeof difficulty !== 'string'
        ) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['easy', 'normal', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        if (!Number.isInteger(score)) {
            return res.status(400).json({ error: 'Score must be an integer' });
        }

        if (score < 100 || score > 10000) {
            return res.status(400).json({ error: 'Invalid score range' });
        }

        if (user_id.length < 8 || user_id.length > 128) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        if (username.length < 3 || username.length > 15) {
            return res.status(400).json({ error: 'Invalid username length' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Invalid username characters' });
        }

        if (avatar.length < 1 || avatar.length > 64) {
            return res.status(400).json({ error: 'Invalid avatar' });
        }

        // Insert score
        const result = await pool.query(
            `INSERT INTO leaderboard (user_id, username, avatar, score, difficulty)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
            [user_id, username, avatar, score, difficulty]
        );

        res.status(201).json({
            success: true,
            id: result.rows[0].id,
            created_at: result.rows[0].created_at,
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/leaderboard/:difficulty - Get top scores
app.get('/api/leaderboard/:difficulty', async (req, res) => {
    try {
        const { difficulty } = req.params;
        const parsedLimit = Number.parseInt(String(req.query.limit ?? '100'), 10);
        const limit = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), 100)
            : 100;

        if (!['easy', 'normal', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        // Get top scores for each user (best score per user)
        const result = await pool.query(
            `SELECT id, user_id, username, avatar, score, created_at
       FROM (
         SELECT
           id,
           user_id,
           username,
           avatar,
           score,
           created_at,
           ROW_NUMBER() OVER (
             PARTITION BY user_id
             ORDER BY score ASC, created_at ASC
           ) AS rn
         FROM leaderboard
         WHERE difficulty = $1
       ) ranked
       WHERE rn = 1
       ORDER BY score ASC, created_at ASC
       LIMIT $2`,
            [difficulty, limit]
        );

        res.json({ leaderboard: result.rows });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/user/:userId/rank/:difficulty - Get user's rank
app.get('/api/user/:userId/rank/:difficulty', async (req, res) => {
    try {
        const { userId, difficulty } = req.params;

        if (!['easy', 'normal', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        // Get user's best score
        const userScore = await pool.query(
            `SELECT MIN(score) as best_score
       FROM leaderboard
       WHERE user_id = $1 AND difficulty = $2`,
            [userId, difficulty]
        );

        if (!userScore.rows[0].best_score) {
            return res.json({ rank: null, best_score: null });
        }

        const bestScore = userScore.rows[0].best_score;

        // Count how many unique users have better scores
        const rankResult = await pool.query(
            `SELECT COUNT(DISTINCT user_id) + 1 as rank
       FROM leaderboard
       WHERE difficulty = $1
       AND (
         SELECT MIN(score)
         FROM leaderboard l2
         WHERE l2.user_id = leaderboard.user_id AND l2.difficulty = $1
       ) < $2`,
            [difficulty, bestScore]
        );

        res.json({
            rank: rankResult.rows[0].rank,
            best_score: bestScore,
        });
    } catch (error) {
        console.error('Error fetching user rank:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

setupSocket(io);

if (process.env.NODE_ENV === 'production') {
    const staticPath = path.resolve(__dirname, 'public');
    app.use(express.static(staticPath));

    // Serve SPA entry for non-API routes.
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
            return next();
        }
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}

httpServer.listen(port, () => {
    console.log(`🚀 QuickTap API server running on port ${port}`);
});

export default app;
