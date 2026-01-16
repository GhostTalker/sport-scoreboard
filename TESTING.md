# Testing Guide - Sport-Scoreboard v3.2.1

This document provides instructions for testing all Track 1 features implemented in v3.2.1.

## Table of Contents
- [Overview](#overview)
- [Test Scripts](#test-scripts)
- [Manual Tests](#manual-tests)
- [Server Configuration Tests](#server-configuration-tests)
- [Integration Tests](#integration-tests)

---

## Overview

**Version:** 3.2.1 (Track 1 - Quick Wins)
**Total Features:** 6
**Test Duration:** ~40 minutes

### Features to Test
1. ✅ CORS Configuration
2. ✅ API Rate Limiting
3. ✅ Feedback Button
4. ✅ PM2 Log Rotation
5. ✅ Non-Root Deployment User
6. ✅ Error Boundary Component

---

## Test Scripts

### 1. CORS Configuration Test

**Script:** `test-cors.sh`
**Platform:** Linux/macOS/Git Bash (Windows)
**Duration:** ~2 minutes

**Run Test:**
```bash
chmod +x test-cors.sh
./test-cors.sh
```

**Expected Results:**
- Test 1 (localhost:5173): ✅ HTTP 200 with CORS headers
- Test 2 (10.1.0.51:3001): ✅ HTTP 200 with CORS headers
- Test 3 (evil.com): ❌ HTTP 500 or no CORS headers
- Test 4 (no origin): ✅ HTTP 200 (same-origin allowed)

**Manual Alternative (curl):**
```bash
# Test allowed origin
curl -H "Origin: http://localhost:5173" -i -X OPTIONS http://10.1.0.51:3001/api/health

# Test blocked origin
curl -H "Origin: http://evil.com" -i -X OPTIONS http://10.1.0.51:3001/api/health
```

---

### 2. Rate Limiting Test

**Script:** `test-rate-limit.sh` (Linux/macOS) or `test-rate-limit.ps1` (Windows)
**Duration:** ~1-2 minutes

**Run Test (Bash):**
```bash
chmod +x test-rate-limit.sh
./test-rate-limit.sh
```

**Run Test (PowerShell - Windows):**
```powershell
.\test-rate-limit.ps1
```

**Expected Results:**
- First 100 requests: ✅ HTTP 200 OK
- Requests 101-105: ❌ HTTP 429 Too Many Requests
- RateLimit headers present in responses
- Success count: 100
- Rate limited count: 5

**Manual Alternative (Bash Loop):**
```bash
for i in {1..105}; do
  echo "Request $i"
  curl -i http://10.1.0.51:3001/api/health 2>&1 | grep -E "HTTP|RateLimit"
done
```

---

## Manual Tests

### 3. Feedback Button Test

**Duration:** ~5 minutes
**Platforms:** Desktop browsers, iPad Safari

**Test Steps:**
1. Open app: http://10.1.0.51:3001
2. Navigate to Settings panel (swipe left or press right arrow)
3. Scroll to bottom of settings
4. Locate "Feedback" section
5. Click blue "Feedback" button

**Expected Results:**
- ✅ Email client opens (Outlook/Mail/Gmail/Safari Mail)
- ✅ To: kevin.goris@mac.com
- ✅ Subject: "Sport-Scoreboard Feedback"
- ✅ Body contains:
  - Version: 3.2.1
  - Sport: (current sport)
  - Competition: (current competition)
  - Browser: (user agent string)
  - Date: (ISO timestamp)
  - Placeholder: [Describe your feedback here]

**Test on Multiple Platforms:**
- [ ] Chrome (Windows)
- [ ] Firefox (Windows)
- [ ] Edge (Windows)
- [ ] Safari (macOS)
- [ ] Safari (iPad)

---

### 4. Error Boundary Test

**Duration:** ~5 minutes
**Modes:** Development & Production

**Test Steps (Development):**
1. Open browser DevTools (F12)
2. Navigate to Console tab
3. Run: `throw new Error('Test error for ErrorBoundary')`
4. Verify ErrorBoundary catches error
5. Check error UI displays correctly
6. Click "Reload App" button
7. Verify app reloads successfully

**Alternative Test (Using ErrorBoundaryTest component):**
1. Open `src/components/settings/DebugControls.tsx`
2. Import ErrorBoundaryTest: `import { ErrorBoundaryTest } from '../debug/ErrorBoundaryTest';`
3. Add component at bottom of DebugControls: `<ErrorBoundaryTest />`
4. Rebuild app: `npm run build`
5. Click "Trigger Render Error" button
6. Verify error boundary catches error

**Expected Results (Development):**
- ✅ No blank white screen
- ✅ Error UI displayed with:
  - ⚠️ Warning icon (red triangle)
  - Title: "Oops! Something went wrong"
  - Message: "The scoreboard encountered an unexpected error..."
  - "Reload App" button (blue)
  - "Try Again" button (gray)
  - Error details (expandable, dev only)
  - Error stack trace (dev only)

**Expected Results (Production):**
- ✅ Same error UI but WITHOUT error details/stack trace
- ✅ "Reload App" and "Try Again" buttons functional

**Visual Checklist:**
- [ ] Error UI matches app design (slate-900/slate-800)
- [ ] Warning icon visible (red triangle)
- [ ] Friendly error message (no technical jargon)
- [ ] Both buttons functional
- [ ] Dev mode shows error details
- [ ] Production mode hides error details

---

## Server Configuration Tests

### 5. PM2 Log Rotation Test

**Duration:** ~5 minutes
**Requires:** SSH access to production server

**Test Steps:**
```bash
# SSH to server
ssh scoreboard-app@10.1.0.51

# Check PM2 modules
pm2 list
# Expected: pm2-logrotate should be listed as a module

# Check configuration
pm2 conf pm2-logrotate
# Expected output:
#   max_size: 10M
#   retain: 7
#   compress: true
#   dateFormat: YYYY-MM-DD_HH-mm-ss
#   rotateModule: true

# Check log directory
ls -lh /srv/GhostGit/nfl-scoreboard/logs/

# Check current logs
ls -lh /srv/GhostGit/nfl-scoreboard/logs/*.log
# Expected: out.log and err.log should exist and be < 10MB

# Check rotated logs (if any)
ls -lh /srv/GhostGit/nfl-scoreboard/logs/*.gz
# Expected: Compressed rotated logs with timestamps

# View recent logs
pm2 logs nfl-scoreboard --lines 20
```

**Expected Results:**
- ✅ pm2-logrotate module installed
- ✅ Configuration matches requirements
- ✅ Log directory exists: `/srv/GhostGit/nfl-scoreboard/logs/`
- ✅ Log files exist: `out.log`, `err.log`
- ✅ Log files < 10MB each
- ✅ Rotation occurs when size exceeds 10MB
- ✅ Compressed archives created (.gz files)
- ✅ Old logs deleted after 7 days

**If Not Configured:**
```bash
# Install and configure pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true
pm2 save

# Verify configuration
pm2 conf pm2-logrotate
```

---

### 6. Non-Root User Test

**Duration:** ~5 minutes
**Requires:** SSH access to production server

**Test Steps:**
```bash
# Test 1: SSH as scoreboard-app user
ssh scoreboard-app@10.1.0.51

# Test 2: Verify user identity
whoami
# Expected: scoreboard-app

# Test 3: Check app directory ownership
ls -la /srv/GhostGit/nfl-scoreboard
# Expected: Owner = scoreboard-app, Group = scoreboard-app

# Test 4: Check PM2 process ownership
pm2 list
ps aux | grep "node.*start:prod"
# Expected: Process running as scoreboard-app user (not root)

# Test 5: Test deployment script
cd /srv/GhostGit/nfl-scoreboard
./deploy.sh
# Expected: Completes without errors, no sudo required

# Test 6: Verify no root access needed
sudo ls
# Expected: Either password prompt or "user not in sudoers" (both acceptable)
```

**Expected Results:**
- ✅ SSH works with scoreboard-app user
- ✅ User identity is scoreboard-app (not root)
- ✅ App directory owned by scoreboard-app:scoreboard-app
- ✅ PM2 process runs as scoreboard-app user
- ✅ Deployment succeeds without sudo
- ✅ User cannot run sudo commands (security)

**If Not Configured:**
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup instructions.

---

## Integration Tests

### Full System Test (1 Hour)

**Objective:** Verify all 6 features work together in production

**Test Steps:**

**1. Deploy v3.2.1**
```bash
ssh scoreboard-app@10.1.0.51 "cd /srv/GhostGit/nfl-scoreboard && ./deploy.sh"
```

**2. Run All Feature Tests (30 minutes)**
- Run CORS test script
- Run rate limiting test script
- Test feedback button on iPad
- Verify PM2 log rotation config
- Verify non-root user permissions
- Trigger test error for error boundary

**3. Monitor App (30 minutes)**
```bash
# SSH to server
ssh scoreboard-app@10.1.0.51

# Monitor PM2 logs
pm2 logs nfl-scoreboard --lines 100

# Monitor system resources
pm2 status
# Expected: Memory < 500M, uptime stable

# Monitor log file sizes
watch -n 60 'ls -lh /srv/GhostGit/nfl-scoreboard/logs/'
```

**4. Stress Test (Optional)**
- Open app in multiple browsers simultaneously
- Hammer API with rate limit test (multiple IPs if possible)
- Trigger errors and verify error boundary handles them
- Monitor memory usage and log file growth

**Expected Results:**
- ✅ All features work correctly
- ✅ No errors in PM2 logs
- ✅ Memory usage stable (< 500MB)
- ✅ Log files rotating correctly
- ✅ App responsive and stable

---

## Test Results Template

Use this template to document test results:

```markdown
# Test Results - v3.2.1

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Environment:** Production (10.1.0.51)

## Feature Test Results

### 1. CORS Configuration
- Test 1 (allowed origin): [ ] PASS / [ ] FAIL
- Test 2 (production origin): [ ] PASS / [ ] FAIL
- Test 3 (blocked origin): [ ] PASS / [ ] FAIL
- Test 4 (no origin): [ ] PASS / [ ] FAIL
- **Notes:**

### 2. Rate Limiting
- Success count (expected 100): _____
- Rate limited count (expected 5): _____
- Headers present: [ ] YES / [ ] NO
- **Status:** [ ] PASS / [ ] FAIL
- **Notes:**

### 3. Feedback Button
- Email client opens: [ ] YES / [ ] NO
- Correct recipient: [ ] YES / [ ] NO
- Body includes version: [ ] YES / [ ] NO
- Body includes context: [ ] YES / [ ] NO
- **Browsers tested:** _____
- **Status:** [ ] PASS / [ ] FAIL
- **Notes:**

### 4. PM2 Log Rotation
- Module installed: [ ] YES / [ ] NO
- Configuration correct: [ ] YES / [ ] NO
- Logs exist: [ ] YES / [ ] NO
- Logs < 10MB: [ ] YES / [ ] NO
- **Status:** [ ] PASS / [ ] FAIL
- **Notes:**

### 5. Non-Root User
- SSH works: [ ] YES / [ ] NO
- User is scoreboard-app: [ ] YES / [ ] NO
- Directory ownership correct: [ ] YES / [ ] NO
- PM2 runs as non-root: [ ] YES / [ ] NO
- Deployment succeeds: [ ] YES / [ ] NO
- **Status:** [ ] PASS / [ ] FAIL
- **Notes:**

### 6. Error Boundary
- Error caught: [ ] YES / [ ] NO
- UI displays correctly: [ ] YES / [ ] NO
- Reload button works: [ ] YES / [ ] NO
- Dev mode shows details: [ ] YES / [ ] NO
- Production hides details: [ ] YES / [ ] NO
- **Status:** [ ] PASS / [ ] FAIL
- **Notes:**

## Overall Result
- **All Tests Passed:** [ ] YES / [ ] NO
- **Ready for Production:** [ ] YES / [ ] NO
- **Issues Found:** _____
- **Recommendations:** _____

**Signature:** _____
```

---

## Troubleshooting

### CORS Tests Fail
**Issue:** CORS headers not present or incorrect
**Fix:**
1. Check `server/index.ts` for allowed origins
2. Verify server is running on correct port (3001)
3. Check browser DevTools Network tab for CORS errors
4. Restart server: `pm2 restart nfl-scoreboard`

### Rate Limiting Not Working
**Issue:** All 105 requests succeed
**Fix:**
1. Verify `express-rate-limit` is installed: `npm list express-rate-limit`
2. Check server logs for rate limit violations
3. Restart server: `pm2 restart nfl-scoreboard`
4. Try from different IP address

### Feedback Button Doesn't Work
**Issue:** Email client doesn't open
**Fix:**
1. Check browser supports mailto: links
2. Try different browser (Safari, Chrome, Firefox)
3. Check if default email client is configured
4. Verify button is visible in Settings panel

### PM2 Logrotate Not Installed
**Issue:** Module not listed in `pm2 list`
**Fix:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 save
```

### Non-Root User Permission Denied
**Issue:** Cannot write to app directory
**Fix:**
```bash
# As root
chown -R scoreboard-app:scoreboard-app /srv/GhostGit/nfl-scoreboard
chmod -R 755 /srv/GhostGit/nfl-scoreboard
```

### Error Boundary Not Catching Errors
**Issue:** Blank white screen still appears
**Fix:**
1. Verify ErrorBoundary is in `main.tsx` wrapping `<App />`
2. Check browser console for error details
3. Rebuild app: `npm run build`
4. Clear browser cache

---

## Additional Resources

- [QA Test Report](./QA_TEST_REPORT_v3.2.1.md) - Comprehensive test documentation
- [QA Summary](./QA_SUMMARY_v3.2.1.md) - Executive summary and sign-off
- [Deployment Guide](./DEPLOYMENT.md) - Server setup and deployment
- [README](./README.md) - Project overview and features
- [CHANGELOG](./CHANGELOG.md) - Version history

---

**Last Updated:** 2026-01-17
**Version:** 3.2.1
