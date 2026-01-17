# Deployment Guide

This document provides comprehensive instructions for deploying the Sport-Scoreboard application to a production server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Initial Server Setup](#initial-server-setup)
- [Application Deployment](#application-deployment)
- [PM2 Configuration](#pm2-configuration)
- [PM2 Log Rotation](#pm2-log-rotation)
- [Health Monitoring](#health-monitoring-v330)
- [Emergency Admin Operations](#emergency-admin-operations)
- [Security Configuration](#security-configuration)
- [Updating the Application](#updating-the-application)
- [Troubleshooting](#troubleshooting)
- [Migration from v3.2.0](#migration-from-v320)

---

## Prerequisites

### Server Requirements
- **OS:** Linux (Ubuntu 20.04+ recommended)
- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **PM2:** Latest version (process manager)
- **Git:** For deployment

### Network Requirements
- Server accessible on port 3001
- Firewall allows inbound connections on port 3001 from LAN
- SSH access for deployment

---

## Pre-Deployment Checklist (v3.2.1+)

Before deploying v3.2.1 or later, ensure the following:

- [ ] PM2 logrotate module installed on server
- [ ] `scoreboard-app` user created with SSH access
- [ ] App directory owned by `scoreboard-app` user
- [ ] CORS origins in `server/index.ts` match your network
- [ ] Rate limiting configured for expected traffic
- [ ] SSH key configured for `scoreboard-app` user
- [ ] PM2 startup script configured for `scoreboard-app`

---

## Initial Server Setup

### 1. Create Deployment User

Run these commands as root:

```bash
# Create the scoreboard-app user
useradd -m -s /bin/bash scoreboard-app

# Create the application directory
mkdir -p /srv/GhostGit/nfl-scoreboard

# Set ownership
chown -R scoreboard-app:scoreboard-app /srv/GhostGit
```

### 2. Configure SSH Access

```bash
# Switch to scoreboard-app user
su - scoreboard-app

# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (replace with your actual public key)
echo "ssh-rsa YOUR_PUBLIC_KEY_HERE your-email@example.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Exit back to root
exit
```

### 3. Install Node.js (if not present)

```bash
# Using NodeSource (as root)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

### 4. Install PM2 Globally

```bash
# As root or with sudo
npm install -g pm2

# For scoreboard-app to use PM2
su - scoreboard-app
pm2 --version
```

---

## Application Deployment

### First-Time Deployment

```bash
# SSH as scoreboard-app
ssh scoreboard-app@10.1.0.51

# Navigate to parent directory
cd /srv/GhostGit

# Clone the repository
git clone https://github.com/GhostTalker/nfl-scoreboard.git
cd nfl-scoreboard

# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
```

### Configure PM2 Startup

```bash
# Generate startup script (run as scoreboard-app)
pm2 startup

# This will output a command to run as root, like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u scoreboard-app --hp /home/scoreboard-app

# Run that command as root, then as scoreboard-app:
pm2 save
```

---

## PM2 Configuration

The application includes an `ecosystem.config.cjs` file for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'nfl-scoreboard',
    script: 'npm',
    args: 'run start:prod',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 start ecosystem.config.cjs` | Start the application |
| `pm2 stop nfl-scoreboard` | Stop the application |
| `pm2 restart nfl-scoreboard` | Restart the application |
| `pm2 reload nfl-scoreboard` | Zero-downtime reload |
| `pm2 logs nfl-scoreboard` | View logs |
| `pm2 logs nfl-scoreboard --lines 100` | View last 100 log lines |
| `pm2 monit` | Monitor CPU/memory |
| `pm2 list` | List all processes |
| `pm2 delete nfl-scoreboard` | Remove from PM2 |

---

## PM2 Log Rotation

Log rotation prevents disk space exhaustion from accumulated logs.

### Install pm2-logrotate Module

```bash
# As scoreboard-app user
pm2 install pm2-logrotate
```

### Configure Rotation Settings

```bash
# Maximum log file size before rotation (default: 10MB)
pm2 set pm2-logrotate:max_size 10M

# Number of rotated files to keep (default: 7)
pm2 set pm2-logrotate:retain 7

# Compress rotated files (default: true)
pm2 set pm2-logrotate:compress true

# Date format for rotated files
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

# Also rotate PM2 module logs
pm2 set pm2-logrotate:rotateModule true

# Rotation interval check (cron format, default: every minute)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Daily at midnight
```

### Verify Configuration

```bash
pm2 conf pm2-logrotate
```

### Log File Locations

- **stdout:** `~/.pm2/logs/nfl-scoreboard-out.log`
- **stderr:** `~/.pm2/logs/nfl-scoreboard-error.log`
- **Rotated files:** `~/.pm2/logs/nfl-scoreboard-out__YYYY-MM-DD_HH-mm-ss.log.gz`

---

## Health Monitoring (v3.3.0+)

The application provides comprehensive health endpoints for monitoring and orchestration platforms.

### Health Endpoints

#### Liveness Probe

Simple check to verify the server process is running. Use for Kubernetes liveness probes or basic uptime monitoring.

```bash
curl http://10.1.0.51:3001/api/health/live
# Returns: 200 OK with { "status": "ok" }
```

#### Readiness Probe

Checks if the application is ready to serve traffic. Returns 503 if the circuit breaker is open or the system is degraded.

```bash
curl http://10.1.0.51:3001/api/health/ready
# Returns: 200 OK if healthy
# Returns: 503 Service Unavailable if degraded
```

#### Full Health Check

Comprehensive status including cache metrics, circuit breaker state, memory usage, and uptime.

```bash
curl http://10.1.0.51:3001/api/health
```

**Example Response:**
```json
{
  "status": "healthy",
  "uptime": 43200,
  "memory": {
    "used": "145MB",
    "limit": "500MB",
    "percentage": 29
  },
  "cache": {
    "espn": {
      "size": "45MB",
      "entries": 127,
      "hitRate": 0.87,
      "hits": 1523,
      "misses": 227
    },
    "openligadb": {
      "size": "12MB",
      "entries": 34,
      "hitRate": 0.92,
      "hits": 892,
      "misses": 78
    }
  },
  "circuitBreaker": {
    "state": "CLOSED",
    "failures": 0,
    "lastFailure": null
  },
  "lastUpdate": "2026-01-17T18:45:23Z"
}
```

### External Monitoring Setup

#### UptimeRobot (Free Tier)

1. Create account at [UptimeRobot](https://uptimerobot.com/)
2. Add new monitor:
   - **Monitor Type:** HTTP(s)
   - **URL:** `http://10.1.0.51:3001/api/health/live`
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** Your email
3. Create status page for event health dashboard

#### Kubernetes Integration

```yaml
# Example Kubernetes deployment snippet
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 2
```

#### PM2 Health Monitoring

```bash
# Check process status
pm2 list

# Monitor CPU/memory in real-time
pm2 monit

# View recent logs
pm2 logs nfl-scoreboard --lines 50

# Combine with health endpoint
watch -n 30 'curl -s http://localhost:3001/api/health | jq .'
```

---

## Emergency Admin Operations

These endpoints are for emergency use when the application is experiencing issues. They are not rate-limited but should be used sparingly.

### Reset Circuit Breaker

If the ESPN API recovers but the circuit breaker remains open, manually reset it:

```bash
curl -X POST http://10.1.0.51:3001/api/admin/reset-circuit
# Returns: { "success": true, "message": "Circuit breaker reset to CLOSED state" }
```

**When to use:**
- API is responding but circuit breaker is stuck in OPEN state
- After investigating and resolving the root cause of failures

### Clear Cache

If cached data is corrupted or stale beyond acceptable limits:

```bash
# Clear ESPN cache
curl -X POST "http://10.1.0.51:3001/api/admin/clear-cache?service=espn"
# Returns: { "success": true, "message": "ESPN cache cleared", "entriesRemoved": 127 }

# Clear OpenLigaDB cache
curl -X POST "http://10.1.0.51:3001/api/admin/clear-cache?service=openligadb"
# Returns: { "success": true, "message": "OpenLigaDB cache cleared", "entriesRemoved": 34 }
```

**When to use:**
- Cached data is showing incorrect scores
- After API schema changes that cause parsing errors
- During development/testing

### Cancel Active Requests

If the application is hanging due to stuck requests:

```bash
curl -X POST http://10.1.0.51:3001/api/admin/cancel-requests
# Returns: { "success": true, "message": "Cancelled N active requests" }
```

**When to use:**
- Application is unresponsive
- Multiple requests are timing out
- Before restarting as a less disruptive alternative

### Pre-Party Validation Script

Run this 1 hour before events to verify system health:

```bash
#!/bin/bash
# pre-party-check.sh

echo "Checking system readiness..."

# Check server uptime
UPTIME=$(curl -s http://10.1.0.51:3001/api/health | jq -r '.uptime')
if [ "$UPTIME" -gt 3600 ]; then
  echo "[OK] Server uptime: $((UPTIME/3600)) hours"
else
  echo "[WARN] Server uptime: $((UPTIME/60)) minutes (recently restarted)"
fi

# Check memory usage
MEMORY=$(curl -s http://10.1.0.51:3001/api/health | jq -r '.memory.percentage')
if [ "$MEMORY" -lt 80 ]; then
  echo "[OK] Memory usage: ${MEMORY}%"
else
  echo "[WARN] Memory usage: ${MEMORY}% (consider restart)"
fi

# Check ESPN API
ESPN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://10.1.0.51:3001/api/scoreboard)
if [ "$ESPN_STATUS" -eq 200 ]; then
  echo "[OK] ESPN API: Responding"
else
  echo "[FAIL] ESPN API: Status $ESPN_STATUS"
fi

# Check circuit breaker
CB_STATE=$(curl -s http://10.1.0.51:3001/api/health | jq -r '.circuitBreaker.state')
if [ "$CB_STATE" = "CLOSED" ]; then
  echo "[OK] Circuit breaker: CLOSED (normal)"
else
  echo "[WARN] Circuit breaker: $CB_STATE"
fi

# Check cache hit rate
HIT_RATE=$(curl -s http://10.1.0.51:3001/api/health | jq -r '.cache.espn.hitRate')
if (( $(echo "$HIT_RATE > 0.7" | bc -l) )); then
  echo "[OK] Cache hit rate: $(echo "$HIT_RATE * 100" | bc)%"
else
  echo "[WARN] Cache hit rate: $(echo "$HIT_RATE * 100" | bc)% (low)"
fi

echo ""
echo "System ready for party!"
```

---

## Security Configuration

### CORS Origins

Edit `server/index.ts` to match your network:

```typescript
const allowedOrigins = [
  'http://localhost:5173',      // Vite dev server
  'http://localhost:3001',      // Production local
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'http://10.1.0.51:3001',      // Your production server IP
  // Add additional IPs as needed
];
```

### Rate Limiting

The API is protected by rate limiting (100 requests per 15 minutes per IP). This is configured in `server/index.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

app.use('/api', limiter);
```

### Firewall Configuration (Optional)

If using UFW:

```bash
# Allow SSH
ufw allow ssh

# Allow port 3001 from LAN only
ufw allow from 10.1.0.0/24 to any port 3001

# Enable firewall
ufw enable
```

---

## Updating the Application

### Using deploy.sh (Recommended)

```bash
ssh scoreboard-app@10.1.0.51
cd /srv/GhostGit/nfl-scoreboard
./deploy.sh
```

### Manual Update

```bash
ssh scoreboard-app@10.1.0.51
cd /srv/GhostGit/nfl-scoreboard

# Pull latest changes
git pull origin master

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart ecosystem.config.cjs
```

### Remote Deployment (from Windows)

```bash
ssh -i "C:\Users\Pit\OneDrive\Dokumente\Security\SSH Keys\MadClusterNet\id_rsa" scoreboard-app@10.1.0.51 "cd /srv/GhostGit/nfl-scoreboard && ./deploy.sh"
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs nfl-scoreboard --lines 50

# Check if port 3001 is in use
lsof -i :3001

# Check Node.js version
node --version
```

### CORS Errors

1. Check browser console for the exact origin being blocked
2. Add that origin to `allowedOrigins` in `server/index.ts`
3. Rebuild and restart: `npm run build && pm2 restart nfl-scoreboard`

### Rate Limit Hit

If you see "429 Too Many Requests":
- Wait 15 minutes for the window to reset
- Or increase the limit in `server/index.ts` if legitimate traffic

### PM2 Not Starting on Boot

```bash
# Regenerate startup script
pm2 unstartup
pm2 startup

# Follow the instructions output by PM2
# Then save the process list
pm2 save
```

### Permission Denied

```bash
# Ensure scoreboard-app owns the directory
sudo chown -R scoreboard-app:scoreboard-app /srv/GhostGit/nfl-scoreboard

# Check file permissions
ls -la /srv/GhostGit/nfl-scoreboard
```

---

## Migration from v3.2.0

If upgrading from v3.2.0 to v3.2.1, follow these steps:

### 1. Create Deployment User (if using root previously)

```bash
# As root on the server
useradd -m -s /bin/bash scoreboard-app
chown -R scoreboard-app:scoreboard-app /srv/GhostGit/nfl-scoreboard

# Set up SSH key for the new user
su - scoreboard-app
mkdir -p ~/.ssh
# Copy your public key to ~/.ssh/authorized_keys
```

### 2. Install PM2 Logrotate

```bash
su - scoreboard-app
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. Update Application

```bash
cd /srv/GhostGit/nfl-scoreboard
git pull origin master
npm install
npm run build
pm2 restart ecosystem.config.cjs
```

### 4. Migrate PM2 Startup (if switching from root)

```bash
# As root, remove old startup
pm2 unstartup

# As scoreboard-app, set up new startup
pm2 startup
# Run the command it outputs as root
pm2 save
```

### 5. Update Local SSH Configuration

Update your local SSH config or deployment scripts to use `scoreboard-app` instead of `root`.

---

## Quick Reference

| Task | Command |
|------|---------|
| Deploy | `./deploy.sh` |
| Start | `pm2 start ecosystem.config.cjs` |
| Stop | `pm2 stop nfl-scoreboard` |
| Restart | `pm2 restart nfl-scoreboard` |
| View Logs | `pm2 logs nfl-scoreboard` |
| Monitor | `pm2 monit` |
| Check Status | `pm2 list` |

---

**Last Updated:** 2026-01-17 (v3.3.0)
