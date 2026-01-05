import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes/api';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes (proxy to ESPN)
app.use('/api', apiRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   NFL Scoreboard Server                               ║
║   Running on http://localhost:${PORT}                    ║
║                                                        ║
║   API Proxy: http://localhost:${PORT}/api                ║
║                                                        ║
║   For iPad access, use your local IP:                 ║
║   http://<your-ip>:${PORT}                               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
