import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced request logging with response time
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`[${timestamp}] → ${req.method} ${req.path}`);

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${statusEmoji} ${req.method} ${req.path} - ${status} (${duration}ms)`);
  });

  next();
});

// API Routes (proxy to ESPN) - MUST be before static files
app.use('/api', apiRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  console.log('[Server] Serving static files from:', distPath);
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
  console.log(`
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
