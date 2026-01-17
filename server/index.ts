/**
 * NFL Scoreboard Express Server
 *
 * Production-grade server with:
 * - CORS security for LAN deployment
 * - Rate limiting for API protection
 * - Graceful shutdown for zero-downtime deployments
 * - Comprehensive request logging
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'http';
import { apiRouter } from './routes/api';
import { espnProxy } from './services/espnProxy';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Force stdout/stderr for PM2 logging
const log = (msg: string) => process.stdout.write(msg + '\n');
const logError = (msg: string) => process.stderr.write(msg + '\n');

// ═══════════════════════════════════════════════════════════════════════
// SECURITY: CORS Configuration
// ═══════════════════════════════════════════════════════════════════════
// Restrict to known origins for private LAN deployment
// Production: http://10.1.0.51:3001 (video wall server)
// Development: localhost on ports 3001 (Express) and 5173 (Vite)
const allowedOrigins = [
  'http://10.1.0.51:3001',     // Production server
  'http://localhost:3001',      // Local production test
  'http://localhost:5173',      // Vite dev server
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, Postman, or same-origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logError(`[SECURITY] Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],  // GET for data, POST for admin endpoints
  credentials: true,
}));

// ═══════════════════════════════════════════════════════════════════════
// SECURITY: API Rate Limiting
// ═══════════════════════════════════════════════════════════════════════
// Protect against abuse and excessive API calls to ESPN proxy
// Limit: 100 requests per 15 minutes per IP address
// Standard headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Max 100 requests per window
  standardHeaders: true,      // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,       // Disable `X-RateLimit-*` headers (use standard instead)
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    logError(`[SECURITY] Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(15 * 60 / 60) + ' minutes',
    });
  },
});

app.use(express.json());

// Enhanced request logging with response time
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  log(`[${timestamp}] -> ${req.method} ${req.path}`);

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusIndicator = status >= 500 ? '[ERROR]' : status >= 400 ? '[WARN]' : '[OK]';
    log(`[${timestamp}] ${statusIndicator} ${req.method} ${req.path} - ${status} (${duration}ms)`);
  });

  next();
});

// API Routes (proxy to ESPN) - MUST be before static files
// Apply rate limiting ONLY to API routes (not static assets)
app.use('/api', apiLimiter, apiRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  log('[Server] Serving static files from: ' + distPath);
  app.use(express.static(distPath));

  // SPA fallback - but NOT for /api routes
  app.get('*', (req, res) => {
    // Skip API routes (they should be handled above)
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Server Startup
// ═══════════════════════════════════════════════════════════════════════

// Store server reference for graceful shutdown
// Note: Using 'let' because TypeScript needs this pattern for the async close() callback
const server: Server = app.listen(PORT, '0.0.0.0', () => {
  log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   NFL Scoreboard Server                               ║
║   Running on http://0.0.0.0:${PORT}                      ║
║                                                        ║
║   API Proxy: http://<your-ip>:${PORT}/api                ║
║                                                        ║
║   For iPad access, use your local IP:                 ║
║   http://<your-ip>:${PORT}                               ║
║                                                        ║
║   Health Check: http://localhost:${PORT}/api/health      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// ═══════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN HANDLER
// ═══════════════════════════════════════════════════════════════════════
// Handles SIGTERM (PM2 restart, Docker stop) and SIGINT (Ctrl+C)
// Ensures:
// 1. No new connections are accepted
// 2. Active requests complete gracefully
// 3. Active ESPN API requests are cancelled
// 4. Force shutdown after timeout (5 seconds)

const SHUTDOWN_TIMEOUT_MS = 5000; // Max 5 seconds for graceful shutdown

/**
 * Track if shutdown is in progress to prevent multiple handlers
 */
let isShuttingDown = false;

/**
 * Graceful shutdown handler
 *
 * Called on SIGTERM (PM2/Docker) or SIGINT (Ctrl+C)
 * Ensures active requests complete before exit
 */
async function gracefulShutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    log(`[Shutdown] Already shutting down, ignoring ${signal}`);
    return;
  }
  isShuttingDown = true;

  log(`\n[Shutdown] Received ${signal} - starting graceful shutdown...`);

  // Create a timeout for force shutdown
  const forceShutdownTimer = setTimeout(() => {
    logError('[Shutdown] Graceful shutdown timeout exceeded - forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    // Step 1: Stop accepting new connections
    log('[Shutdown] Step 1/3: Stopping new connections...');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logError(`[Shutdown] Error closing server: ${err.message}`);
          reject(err);
        } else {
          log('[Shutdown] Server closed - no new connections');
          resolve();
        }
      });
    });

    // Step 2: Cancel all active ESPN API requests
    log('[Shutdown] Step 2/3: Cancelling active API requests...');
    espnProxy.cancelAllRequests();

    // Step 3: Small delay to let any final responses complete
    log('[Shutdown] Step 3/3: Waiting for active responses to complete...');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear the force shutdown timer
    clearTimeout(forceShutdownTimer);

    log('[Shutdown] Graceful shutdown complete');
    process.exit(0);

  } catch (error) {
    clearTimeout(forceShutdownTimer);
    logError(`[Shutdown] Error during graceful shutdown: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Register shutdown handlers for common signals
// SIGTERM: Sent by PM2/Docker for graceful restart
// SIGINT: Sent by Ctrl+C in terminal
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  logError(`[FATAL] Uncaught exception: ${error.message}`);
  logError(error.stack || 'No stack trace');
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`[FATAL] Unhandled rejection at: ${promise}`);
  logError(`Reason: ${reason instanceof Error ? reason.message : reason}`);
  // Don't exit on unhandled rejections - just log
  // This prevents a single bad promise from taking down the server
});

// Export for testing
export { app, server };
