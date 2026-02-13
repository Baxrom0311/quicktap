# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (pnpm)
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build frontend and backend
# This runs "vite build" (client -> dist/public) and "esbuild" (server -> dist/server.js)
RUN pnpm run build

# Stage 2: Production Run
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# Copy package.json and install ONLY production dependencies
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Copy built assets from builder
COPY --from=builder /app/dist ./dist 

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]
