# Sport-Scoreboard - Multi-stage Docker Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build frontend (Vite) and compile TypeScript
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies + tsx for TypeScript runtime
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx cross-env

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (runs via tsx at runtime)
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.node.json ./tsconfig.node.json

# Copy static assets (logos, celebration videos, title graphics)
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check using the built-in health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health/live || exit 1

CMD ["npx", "cross-env", "NODE_ENV=production", "tsx", "server/index.ts"]
