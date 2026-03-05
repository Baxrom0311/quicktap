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
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { CorsOptions } from 'cors';

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

function parseAllowedOrigins(value: string | undefined): string[] {
    if (!value) {
        return ['http://localhost:5173', 'http://localhost:3001'];
    }
    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

function isOriginAllowed(origin: string | undefined): boolean {
    // Non-browser requests (no Origin header) should pass.
    if (!origin) return true;
    return allowedOrigins.includes(origin);
}

const corsOriginHandler: CorsOptions['origin'] = (origin, callback) => {
    if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
    }
    callback(new Error('Not allowed by CORS'));
};

// Middleware
app.use(helmet());

app.use(cors({
    origin: corsOriginHandler,
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

// Structured logging helper
function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, any>) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(meta || {}),
    };
    if (level === 'error') console.error(JSON.stringify(entry));
    else if (level === 'warn') console.warn(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
}

// Health check (with DB ping)
app.get('/api/health', async (_req, res) => {
    try {
        const dbResult = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db: { connected: true, time: dbResult.rows[0].now },
            uptime: process.uptime(),
        });
    } catch (err) {
        log('error', 'Health check DB ping failed', { error: String(err) });
        res.status(503).json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            db: { connected: false },
        });
    }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';
if (!process.env.JWT_SECRET) {
    console.warn('[security] JWT_SECRET is not set; using development fallback secret.');
}
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev_secret_key_12345') {
    throw new Error('JWT_SECRET must be set in production.');
}

const GUEST_TOKEN_TTL_SECONDS = Number.parseInt(
    process.env.GUEST_TOKEN_TTL_SECONDS ?? '2592000',
    10
);

interface AuthTokenPayload extends jwt.JwtPayload {
    sub: string;
    scope?: 'guest';
}

interface AuthenticatedRequest extends express.Request {
    auth?: AuthTokenPayload;
}

function createGuestSession() {
    const playerId = randomBytes(16).toString('hex');
    const accessToken = jwt.sign({ scope: 'guest' }, JWT_SECRET, {
        subject: playerId,
        expiresIn: GUEST_TOKEN_TTL_SECONDS,
    });

    return {
        accessToken,
        playerId,
        expiresInSeconds: GUEST_TOKEN_TTL_SECONDS,
    };
}

// Auth Middleware
const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
            return res.sendStatus(403);
        }

        req.auth = decoded as AuthTokenPayload;
        next();
    } catch {
        return res.sendStatus(403);
    }
};

function resolveOptionalViewerPlayerId(req: express.Request): string | null {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'object' && decoded !== null && typeof decoded.sub === 'string') {
            return decoded.sub;
        }
    } catch {
        // Ignore invalid tokens for public leaderboard requests.
    }

    return null;
}

// POST /api/auth/guest - Create a fresh anonymous session.
app.post('/api/auth/guest', (_req, res) => {
    res.json(createGuestSession());
});

// Legacy route: keep for older clients, but issue server-generated guest sessions.
app.post('/api/auth/login', (_req, res) => {
    res.json(createGuestSession());
});

// POST /api/scores - Submit a new score (PROTECTED)
app.post('/api/scores', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const { username, avatar, score, difficulty } = req.body;
        const userId = req.auth?.sub;

        // Validation
        if (
            typeof userId !== 'string' ||
            typeof username !== 'string' ||
            typeof avatar !== 'string' ||
            typeof score !== 'number' ||
            typeof difficulty !== 'string'
        ) {
            return res.status(400).json({ error: 'Invalid payload' });
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

        if (userId.length < 8 || userId.length > 128) {
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
            [userId, username, avatar, score, difficulty]
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
// Query params: limit (1-100), offset (0+), period (today|week|month|all)
app.get('/api/leaderboard/:difficulty', async (req, res) => {
    try {
        const { difficulty } = req.params;
        const viewerPlayerId = resolveOptionalViewerPlayerId(req);
        const parsedLimit = Number.parseInt(String(req.query.limit ?? '50'), 10);
        const limit = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), 100)
            : 50;
        const parsedOffset = Number.parseInt(String(req.query.offset ?? '0'), 10);
        const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;
        const period = String(req.query.period || 'all');

        if (!['easy', 'normal', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        // Build time filter
        let timeFilter = '';
        if (period === 'today') {
            timeFilter = `AND created_at >= NOW() - INTERVAL '1 day'`;
        } else if (period === 'week') {
            timeFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        } else if (period === 'month') {
            timeFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        }

        // Get top scores for each user (best score per user)
        const result = await pool.query(
            `SELECT id, username, avatar, score, created_at,
              CASE WHEN $4::text IS NULL THEN false ELSE user_id = $4::text END AS is_me
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
         WHERE difficulty = $1 ${timeFilter}
       ) ranked
       WHERE rn = 1
       ORDER BY score ASC, created_at ASC
       LIMIT $2 OFFSET $3`,
            [difficulty, limit, offset, viewerPlayerId]
        );

        // Also return total count for pagination
        const countResult = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as total
       FROM leaderboard
       WHERE difficulty = $1 ${timeFilter}`,
            [difficulty]
        );

        res.json({
            leaderboard: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit,
            offset,
            period,
        });
    } catch (error) {
        log('error', 'Error fetching leaderboard', { error: String(error) });
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
        if (typeof userId !== 'string' || userId.length < 8 || userId.length > 128) {
            return res.status(400).json({ error: 'Invalid user id' });
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
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST']
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
    log('info', `QuickTap API server running on port ${port}`, { port, env: process.env.NODE_ENV });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
    log('info', `Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
        log('info', 'HTTP server closed');
    });
    try {
        await pool.end();
        log('info', 'Database pool closed');
    } catch (err) {
        log('error', 'Error closing DB pool', { error: String(err) });
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
