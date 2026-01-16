# Security Configuration

This document details the security measures implemented in the Sport-Scoreboard application as of v3.2.1.

## Table of Contents

- [Threat Model](#threat-model)
- [CORS Configuration](#cors-configuration)
- [API Rate Limiting](#api-rate-limiting)
- [Non-Root Deployment](#non-root-deployment)
- [Log Management](#log-management)
- [Network Security](#network-security)
- [Configuration Reference](#configuration-reference)

---

## Threat Model

### Deployment Context

The Sport-Scoreboard application is designed for **private network deployment** only:

| Assumption | Description |
|------------|-------------|
| Network | Trusted home LAN or office network |
| Users | Trusted individuals (family, colleagues) |
| Exposure | No public internet access |
| Authentication | None (trusted network assumption) |

### In Scope

The following threats are addressed:

- **Denial of Service (local)**: Rate limiting prevents resource exhaustion from excessive API calls
- **CORS bypass**: Strict origin allowlist prevents unauthorized cross-origin requests
- **Privilege escalation**: Non-root deployment limits potential damage from compromised process
- **Log exhaustion**: Log rotation prevents disk space exhaustion

### Out of Scope

The following are NOT addressed (by design):

- **Authentication/Authorization**: No user login system
- **Data encryption in transit**: HTTP only (HTTPS optional)
- **Input validation attacks**: Minimal user input, data from trusted APIs
- **Public internet exposure**: Application assumes private network

---

## CORS Configuration

### Overview

Cross-Origin Resource Sharing (CORS) is restricted to an explicit allowlist of origins.

### Configuration Location

File: `server/index.ts`

```typescript
const allowedOrigins = [
  'http://localhost:5173',      // Vite dev server
  'http://localhost:3001',      // Production local
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'http://10.1.0.51:3001',      // Production server
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Adding New Origins

To allow access from a new IP address:

1. Edit `server/index.ts`
2. Add the new origin to `allowedOrigins` array:
   ```typescript
   'http://192.168.1.100:3001',  // New device
   ```
3. Rebuild: `npm run build`
4. Restart: `pm2 restart nfl-scoreboard`

### Troubleshooting CORS Errors

If you see "Not allowed by CORS" in browser console:

1. Check the exact origin in the error message
2. Add that origin to `allowedOrigins`
3. Rebuild and restart

---

## API Rate Limiting

### Overview

All API endpoints are protected by rate limiting to prevent abuse and ensure fair resource usage.

### Configuration

File: `server/index.ts`

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Max 100 requests per window
  standardHeaders: true,     // Return rate limit info in headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  }
});

app.use('/api', limiter);
```

### Settings Explained

| Setting | Value | Description |
|---------|-------|-------------|
| `windowMs` | 15 minutes | Time window for counting requests |
| `max` | 100 | Maximum requests per IP per window |
| `standardHeaders` | true | Include `RateLimit-*` headers in response |
| `message` | Object | Response body when limit exceeded |

### Response Headers

When approaching the limit, responses include:

```
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 1705510800
```

### Normal Usage Patterns

| Operation | Frequency | Requests per 15 min |
|-----------|-----------|---------------------|
| Live game polling | 10 seconds | ~90 |
| Scheduled game polling | 1 minute | ~15 |
| Final game polling | 5 minutes | ~3 |
| Page load | Once | ~3 |

Normal usage stays well within the 100-request limit.

### Adjusting Rate Limits

For high-traffic scenarios (multiple simultaneous users):

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,  // Increase limit
  // ...
});
```

---

## Non-Root Deployment

### Overview

The application runs under a dedicated `scoreboard-app` user with minimal privileges.

### Security Benefits

| Benefit | Description |
|---------|-------------|
| Principle of least privilege | Process cannot access system files |
| Blast radius reduction | Compromised process limited to app directory |
| Audit trail | Actions attributed to specific user |
| No sudo required | Normal operation doesn't need elevated privileges |

### User Configuration

```bash
# Create user (as root, one-time)
useradd -m -s /bin/bash scoreboard-app

# Set directory ownership
chown -R scoreboard-app:scoreboard-app /srv/GhostGit/nfl-scoreboard

# Verify permissions
ls -la /srv/GhostGit/nfl-scoreboard
```

### SSH Access

```bash
# Set up SSH key for scoreboard-app
su - scoreboard-app
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Add public key to ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### PM2 as Non-Root

PM2 runs as `scoreboard-app`, not root:

```bash
# As scoreboard-app
pm2 start ecosystem.config.cjs
pm2 startup  # Follow instructions for systemd
pm2 save
```

---

## Log Management

### Overview

PM2 logs are automatically rotated to prevent disk exhaustion.

### Log Locations

| Log Type | Path |
|----------|------|
| stdout | `~/.pm2/logs/nfl-scoreboard-out.log` |
| stderr | `~/.pm2/logs/nfl-scoreboard-error.log` |
| Rotated | `~/.pm2/logs/nfl-scoreboard-out__YYYY-MM-DD.log.gz` |

### Rotation Configuration

```bash
# Install pm2-logrotate
pm2 install pm2-logrotate

# Configure settings
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true
```

### Settings Explained

| Setting | Value | Description |
|---------|-------|-------------|
| `max_size` | 10M | Rotate when log exceeds 10 MB |
| `retain` | 7 | Keep 7 rotated files |
| `compress` | true | Gzip rotated files |
| `dateFormat` | YYYY-MM-DD_HH-mm-ss | Timestamp format for rotated files |
| `rotateModule` | true | Also rotate PM2 module logs |

### Viewing Logs

```bash
# Live log stream
pm2 logs nfl-scoreboard

# Last 100 lines
pm2 logs nfl-scoreboard --lines 100

# Error logs only
pm2 logs nfl-scoreboard --err
```

---

## Network Security

### Firewall Configuration (Optional)

If using UFW on Ubuntu:

```bash
# Allow SSH
ufw allow ssh

# Allow port 3001 from LAN only (adjust subnet as needed)
ufw allow from 10.1.0.0/24 to any port 3001

# Deny all other incoming
ufw default deny incoming

# Allow outgoing (for API calls)
ufw default allow outgoing

# Enable firewall
ufw enable

# Verify rules
ufw status verbose
```

### Port Exposure

| Port | Service | Access |
|------|---------|--------|
| 22 | SSH | Admin only |
| 3001 | Application | LAN devices |
| 5173 | Vite dev server | Development only |

### HTTPS (Optional)

For HTTPS support, use a reverse proxy like nginx:

```nginx
server {
    listen 443 ssl;
    server_name scoreboard.local;

    ssl_certificate /etc/ssl/certs/scoreboard.crt;
    ssl_certificate_key /etc/ssl/private/scoreboard.key;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Configuration Reference

### Quick Reference Table

| Feature | Location | Default |
|---------|----------|---------|
| CORS origins | `server/index.ts` | localhost, 10.1.0.51 |
| Rate limit window | `server/index.ts` | 15 minutes |
| Rate limit max | `server/index.ts` | 100 requests |
| Log max size | pm2-logrotate | 10 MB |
| Log retention | pm2-logrotate | 7 days |
| Deployment user | System | `scoreboard-app` |

### Environment Variables

No sensitive environment variables are required for security configuration. All settings are in code files.

### Secrets Management

The application does not handle secrets beyond the optional API-Football key (for Bundesliga live minutes). This key is stored in `.env` which is git-ignored.

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Use the Feedback button in Settings (includes app context)
3. Or email the maintainer directly

---

**Last Updated:** 2026-01-17 (v3.2.1)
