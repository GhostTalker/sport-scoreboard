import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api';

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
  methods: ['GET'],  // Only GET requests needed - no POST/PUT/DELETE
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
  log(`[${timestamp}] → ${req.method} ${req.path}`);

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    log(`[${timestamp}] ${statusEmoji} ${req.method} ${req.path} - ${status} (${duration}ms)`);
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

// Start server on all interfaces (0.0.0.0) for network access
app.listen(PORT, '0.0.0.0', () => {
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
╚════════════════════════════════════════════════════════╝
  `);
});
