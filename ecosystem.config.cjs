/**
 * PM2 Ecosystem Configuration
 * ============================================================================
 *
 * This file configures PM2 process management for the Sport-Scoreboard app.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs                    # Start with default env
 *   pm2 start ecosystem.config.cjs --env production   # Explicit production
 *   pm2 start ecosystem.config.cjs --env development  # Development mode
 *   pm2 restart ecosystem.config.cjs                  # Restart with current env
 *   pm2 reload ecosystem.config.cjs                   # Zero-downtime reload
 *   pm2 stop nfl-scoreboard                           # Stop the app
 *   pm2 delete nfl-scoreboard                         # Remove from PM2
 *
 * Monitoring:
 *   pm2 monit                                         # Real-time monitoring
 *   pm2 logs nfl-scoreboard                           # View logs
 *   pm2 logs nfl-scoreboard --lines 100               # Last 100 lines
 *   pm2 status                                        # Process status
 *
 * Log rotation (install pm2-logrotate module):
 *   pm2 install pm2-logrotate
 *   pm2 set pm2-logrotate:max_size 10M
 *   pm2 set pm2-logrotate:retain 7
 *   pm2 set pm2-logrotate:compress true
 *
 * ============================================================================
 */

module.exports = {
  apps: [
    {
      // =====================================================================
      // Application Identity
      // =====================================================================
      name: 'nfl-scoreboard',
      script: 'npm',
      args: 'run start:prod',
      cwd: './',

      // =====================================================================
      // Process Management
      // =====================================================================

      // Single instance - this is a stateful app with in-memory cache
      // Multiple instances would cause cache fragmentation
      instances: 1,

      // Execution mode: 'fork' for single instance, 'cluster' for multiple
      exec_mode: 'fork',

      // Auto-restart on crash
      autorestart: true,

      // Don't watch files in production (use deploy.sh for updates)
      watch: false,

      // Restart if memory exceeds this limit (prevents memory leaks)
      // The app typically uses 80-150MB, so 500MB is generous headroom
      max_memory_restart: '500M',

      // Restart delay to prevent rapid restart loops
      restart_delay: 4000, // 4 seconds

      // Maximum restarts within min_uptime before giving up
      max_restarts: 10,

      // Minimum uptime to consider as "stable" (avoids restart loops)
      min_uptime: '10s',

      // Kill timeout - wait this long for graceful shutdown
      kill_timeout: 5000, // 5 seconds

      // Listen timeout for cluster mode (not used in fork mode)
      listen_timeout: 8000,

      // =====================================================================
      // Logging Configuration
      // =====================================================================

      // Log file paths (relative to cwd)
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',

      // Combine stdout and stderr into out_file
      merge_logs: true,

      // Prefix log lines with timestamp
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',

      // Add timestamps to logs
      time: true,

      // =====================================================================
      // Environment Variables - Production (Default)
      // =====================================================================
      env: {
        NODE_ENV: 'production',
        PORT: 3001,

        // Cache configuration (seconds)
        // These match the defaults in espnProxy.ts
        CACHE_TTL_LIVE: 15,        // 15s for live game data
        CACHE_TTL_SCHEDULE: 300,   // 5m for schedule data
        CACHE_TTL_STALE: 1800,     // 30m stale data acceptable during outages

        // Circuit breaker configuration
        CIRCUIT_FAILURE_THRESHOLD: 5,
        CIRCUIT_RESET_TIMEOUT: 30000, // 30 seconds

        // Request timeouts (milliseconds)
        API_TIMEOUT: 10000,  // 10 seconds
      },

      // =====================================================================
      // Environment Variables - Development
      // =====================================================================
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,

        // Shorter cache TTLs for development
        CACHE_TTL_LIVE: 5,
        CACHE_TTL_SCHEDULE: 60,
        CACHE_TTL_STALE: 300,

        // More sensitive circuit breaker for faster feedback
        CIRCUIT_FAILURE_THRESHOLD: 3,
        CIRCUIT_RESET_TIMEOUT: 15000,

        API_TIMEOUT: 5000,
      },

      // =====================================================================
      // Environment Variables - Staging
      // =====================================================================
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3002, // Different port to run alongside production

        CACHE_TTL_LIVE: 10,
        CACHE_TTL_SCHEDULE: 120,
        CACHE_TTL_STALE: 600,

        CIRCUIT_FAILURE_THRESHOLD: 5,
        CIRCUIT_RESET_TIMEOUT: 30000,

        API_TIMEOUT: 10000,
      },

      // =====================================================================
      // Advanced Options
      // =====================================================================

      // Source maps for better error traces
      source_map_support: true,

      // Don't auto-start on PM2 startup (use pm2 save instead)
      // Set to true if you want auto-start
      // autostart: true,

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,

      // Post-update actions (if using PM2 deploy)
      // post_update: ['npm install', 'npm run build'],
    },
  ],

  // ===========================================================================
  // Deployment Configuration (Optional - for pm2 deploy)
  // ===========================================================================
  // Uncomment and configure if you want to use `pm2 deploy` instead of deploy.sh
  //
  // deploy: {
  //   production: {
  //     user: 'scoreboard-app',
  //     host: '10.1.0.51',
  //     ref: 'origin/version-3.0',
  //     repo: 'git@github.com:your-org/nfl-scoreboard.git',
  //     path: '/srv/GhostGit/nfl-scoreboard',
  //     'pre-deploy-local': '',
  //     'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.cjs --env production',
  //     'pre-setup': '',
  //   },
  // },
};
