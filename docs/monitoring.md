# Monitoring Guide

This document describes the monitoring strategy for the Sport-Scoreboard application.

## Table of Contents

- [Health Endpoints](#health-endpoints)
- [External Monitoring Setup](#external-monitoring-setup)
- [Alert Configuration](#alert-configuration)
- [PM2 Monitoring](#pm2-monitoring)
- [Log Management](#log-management)
- [Incident Response](#incident-response)
- [Metrics Reference](#metrics-reference)

---

## Health Endpoints

The application exposes three health endpoints for different monitoring purposes:

### `/api/health/live` - Liveness Check

**Purpose:** Confirms the process is running and can respond to requests.

**Use For:**
- External uptime monitoring (UptimeRobot, BetterUptime, Pingdom)
- Load balancer health checks
- Basic "is it up?" checks

**Response:**
```json
{
  "status": "alive",
  "timestamp": 1705593600000
}
```

**Recommended Polling:** Every 60 seconds

**Failure Meaning:** Process is dead or unresponsive - requires restart.

---

### `/api/health/ready` - Readiness Check

**Purpose:** Indicates whether the application is ready to serve traffic properly.

**Use For:**
- Deployment health verification
- More nuanced monitoring
- Detecting degraded service states

**Response (Healthy):**
```json
{
  "status": "ready",
  "timestamp": 1705593600000
}
```

**Response (Degraded):**
```json
{
  "status": "degraded",
  "reason": "ESPN API circuit breaker is open - serving cached data",
  "circuitState": "OPEN",
  "nextRetryIn": "25s",
  "timestamp": 1705593600000
}
```

**Recommended Polling:** Every 30 seconds

**Failure Meaning:** Application is running but may not be serving fresh data.

---

### `/api/health` - Comprehensive Health

**Purpose:** Detailed health information for debugging and dashboards.

**Use For:**
- Grafana dashboards
- Detailed debugging
- Capacity planning

**Response:**
```json
{
  "status": "healthy",
  "uptime": 86400,
  "uptimeFormatted": "1d 0h 0m 0s",
  "memory": {
    "used": "85.3MB",
    "total": "120.5MB",
    "rss": "145.2MB"
  },
  "services": {
    "espn": {
      "status": "healthy",
      "circuitBreaker": {
        "state": "CLOSED",
        "failureCount": 0
      },
      "activeRequests": 0
    },
    "openligadb": {
      "status": "healthy"
    }
  },
  "cache": {
    "espn": {
      "size": "2.1MB",
      "entries": 15,
      "hitRate": "0.89",
      "hits": 1523,
      "misses": 187
    }
  },
  "lastUpdate": "2026-01-18T15:30:00.000Z"
}
```

---

## External Monitoring Setup

### Option 1: UptimeRobot (Free Tier Available)

[UptimeRobot](https://uptimerobot.com/) offers free monitoring with 5-minute intervals.

**Setup:**
1. Create account at uptimerobot.com
2. Add New Monitor
3. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Sport-Scoreboard
   - **URL:** `http://YOUR_SERVER_IP:3001/api/health/live`
   - **Monitoring Interval:** 5 minutes (free) or 1 minute (paid)

**Alert Contacts:**
- Email (free)
- SMS (paid)
- Webhook (paid - useful for Slack/Discord)

**Pro Tier Benefits:**
- 1-minute intervals
- SMS alerts
- Status pages
- Webhooks

---

### Option 2: BetterUptime (Recommended)

[BetterUptime](https://betteruptime.com/) provides more sophisticated monitoring with a generous free tier.

**Setup:**
1. Create account at betteruptime.com
2. Add Monitor
3. Configure:
   - **URL:** `http://YOUR_SERVER_IP:3001/api/health/live`
   - **Check Frequency:** 1 minute
   - **Request Timeout:** 10 seconds

**Recommended Monitors:**

| Monitor Name | Endpoint | Frequency | Timeout |
|--------------|----------|-----------|---------|
| Scoreboard Liveness | `/api/health/live` | 60s | 10s |
| Scoreboard Readiness | `/api/health/ready` | 30s | 10s |

**Incident Rules:**
- Confirmed after: 3 consecutive failures
- Resolved after: 1 success

**Free Tier Includes:**
- 10 monitors
- 3-minute intervals
- Email + SMS alerts
- Status page
- Slack integration

---

### Option 3: Pingdom

[Pingdom](https://www.pingdom.com/) is a premium option with detailed analytics.

**Best For:** Organizations needing detailed SLA reporting and historical analytics.

---

### Option 4: Self-Hosted (Uptime Kuma)

[Uptime Kuma](https://github.com/louislam/uptime-kuma) is a free, self-hosted alternative.

**Docker Deployment:**
```bash
docker run -d \
  --name uptime-kuma \
  --restart unless-stopped \
  -p 3010:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

**Pros:**
- Free
- Full control
- No external dependencies
- Rich notification options

**Cons:**
- Requires server to host it
- Self-maintenance

---

## Alert Configuration

### Recommended Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Response Time | > 2s | > 5s | Investigate load |
| Consecutive Failures | 2 | 3 | Check logs, consider restart |
| Memory Usage | > 400MB | > 480MB | PM2 will auto-restart at 500MB |
| Circuit Breaker | OPEN | N/A | Check ESPN API status |

### Alert Escalation

**Level 1 - Warning (Email):**
- 2 consecutive health check failures
- Response time > 2 seconds
- Circuit breaker opens

**Level 2 - Critical (SMS/Call):**
- 3+ consecutive health check failures
- Application completely unresponsive
- Automatic rollback triggered

### Notification Channels

Configure these in your monitoring service:

1. **Email** - Primary notification
2. **Slack/Discord** - Team visibility
3. **SMS** - Critical alerts only
4. **PagerDuty** - If using on-call rotation

---

## PM2 Monitoring

### Real-Time Monitoring

```bash
# Terminal-based dashboard
pm2 monit

# Simple status
pm2 status

# Detailed process info
pm2 describe nfl-scoreboard
```

### Log Monitoring

```bash
# Stream logs in real-time
pm2 logs nfl-scoreboard

# Last 100 lines
pm2 logs nfl-scoreboard --lines 100

# Only errors
pm2 logs nfl-scoreboard --err
```

### PM2 Web Dashboard (pm2.io)

PM2 offers a cloud dashboard at [pm2.io](https://pm2.io/):

```bash
# Link to pm2.io (free tier available)
pm2 link <secret> <public>
```

**Features:**
- Real-time metrics
- Historical data
- Exception tracking
- Deployment tracking

---

## Log Management

### Log Rotation Setup

Install the pm2-logrotate module:

```bash
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M      # Rotate when file exceeds 10MB
pm2 set pm2-logrotate:retain 7          # Keep 7 rotated files
pm2 set pm2-logrotate:compress true     # Compress rotated files
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true # Rotate PM2 module logs too
pm2 set pm2-logrotate:workerInterval 30 # Check every 30 seconds
```

### Log Locations

| Log | Path | Purpose |
|-----|------|---------|
| PM2 Output | `./logs/pm2-out.log` | Application stdout |
| PM2 Errors | `./logs/pm2-error.log` | Application stderr |
| Deploy Log | `./logs/deploy.log` | Deployment history |
| Rollback Log | `./logs/rollback.log` | Rollback history |

### Log Analysis

For a simple local deployment, grep and tail work well:

```bash
# Recent errors
grep -i error ./logs/pm2-error.log | tail -20

# Deployment history
cat ./logs/deploy.log | tail -50

# Find specific issues
grep "circuit breaker" ./logs/pm2-out.log
```

For more advanced needs, consider:
- **Loki + Grafana** - Free, self-hosted
- **Papertrail** - Cloud log aggregation
- **Datadog** - Enterprise observability

---

## Incident Response

### Runbook: Application Unresponsive

1. **Verify the issue**
   ```bash
   curl -s http://localhost:3001/api/health/live
   ```

2. **Check PM2 status**
   ```bash
   pm2 status
   pm2 logs nfl-scoreboard --lines 50
   ```

3. **Restart if needed**
   ```bash
   pm2 restart nfl-scoreboard
   ```

4. **If restart fails, check for port conflicts**
   ```bash
   lsof -i :3001
   ```

5. **Rollback if recent deployment**
   ```bash
   ./rollback.sh --latest
   ```

### Runbook: High Memory Usage

1. **Check current memory**
   ```bash
   pm2 describe nfl-scoreboard | grep memory
   # Or via API
   curl -s http://localhost:3001/api/health | jq '.memory'
   ```

2. **Clear caches if needed**
   ```bash
   curl -X POST http://localhost:3001/api/admin/clear-cache
   ```

3. **Restart to reset memory**
   ```bash
   pm2 restart nfl-scoreboard
   ```

### Runbook: ESPN API Degraded

1. **Check circuit breaker status**
   ```bash
   curl -s http://localhost:3001/api/health | jq '.services.espn'
   ```

2. **If circuit is OPEN, app is serving cached data** (this is expected behavior)

3. **To manually reset circuit breaker** (only after verifying ESPN is back):
   ```bash
   curl -X POST http://localhost:3001/api/admin/reset-circuit
   ```

4. **Monitor for recovery**
   ```bash
   watch -n 5 'curl -s http://localhost:3001/api/health | jq ".services.espn"'
   ```

---

## Metrics Reference

### Key Metrics to Track

| Metric | Source | Good | Warning | Critical |
|--------|--------|------|---------|----------|
| Uptime % | External monitor | > 99.9% | < 99.5% | < 99% |
| Response Time | External monitor | < 500ms | > 2s | > 5s |
| Memory Used | `/api/health` | < 200MB | > 400MB | > 480MB |
| Cache Hit Rate | `/api/health` | > 80% | < 60% | < 40% |
| Circuit Breaker | `/api/health` | CLOSED | HALF-OPEN | OPEN |
| Restart Count | `pm2 describe` | 0-1/day | 3-5/day | > 5/day |

### SLO Recommendations

For a personal/small-team scoreboard app:

| SLI | Target SLO |
|-----|------------|
| Availability | 99.5% (43.8 min downtime/week) |
| Response Time (p95) | < 1 second |
| Error Rate | < 1% |

---

## Quick Reference

### Health Check URLs

```
Liveness:  http://YOUR_IP:3001/api/health/live
Readiness: http://YOUR_IP:3001/api/health/ready
Full:      http://YOUR_IP:3001/api/health
```

### Common Commands

```bash
# Check if app is running
curl -s http://localhost:3001/api/health/live | jq

# View detailed health
curl -s http://localhost:3001/api/health | jq

# PM2 status
pm2 status

# View logs
pm2 logs nfl-scoreboard --lines 50

# Restart
pm2 restart nfl-scoreboard

# Deploy
./deploy.sh

# Rollback
./rollback.sh --latest
```

### Emergency Contacts

Update these for your team:

| Role | Contact |
|------|---------|
| Primary On-Call | [your-email] |
| Backup On-Call | [backup-email] |
| Escalation | [manager-email] |
