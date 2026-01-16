# 📋 PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Sport-Scoreboard: Video Wall Edition
### Version 3.2 → 4.0 Roadmap

**Document Version:** 1.0
**Date:** 2026-01-16
**Author:** Claude Code + User (Co-Authored)
**Project Status:** Active Development (v3.2.0 in Production)

---

## 🎯 EXECUTIVE SUMMARY

### Vision Statement
Transform the Sport-Scoreboard from a functional iPad app into a **bulletproof video wall display system** optimized for sports viewing parties and social gatherings, delivering real-time multi-sport scores with visual polish and rock-solid reliability.

### Primary Use Case: Video Wall for Parties
**Target Scenario:** Host displays live sports scores on large screen during viewing parties (Super Bowl, NFL playoffs, Bundesliga matchdays, UEFA Champions League nights) with 5-20 guests watching.

**Success Criteria:**
- ✅ **99.9% uptime during scheduled events** (no crashes when guests are watching)
- ✅ **Visual appeal optimized for large displays** (readable from across room)
- ✅ **Zero manual intervention needed during parties** (fully autonomous operation)
- ✅ **Sub-10-second score updates** for live games
- ✅ **Graceful error handling** (never shows blank screen)

### Key Insights from User Context
- **Deployment:** Private network (10.1.0.51) - Security less critical, reliability paramount
- **Current State:** No pain points - app works well, focus on enhancements not fixes
- **Development Model:** AI co-authored with Claude Code - can tackle complex features faster
- **Timeline:** 3-Track parallel development (12-week horizon)

---

## 👥 USER PERSONAS

### Primary Persona: Party Host (You)
**Role:** Setup, monitor, troubleshoot scoreboard

**Goals:**
- Set up scoreboard before guests arrive (30 min advance setup)
- Monitor that it's working during party (glance checks)
- Never need to SSH/debug during an event
- Impress guests with polished, professional display

**Pain Points (Potential):**
- App crashes during big moment = embarrassment
- Wrong game displayed = manual fix needed
- API failures = blank screen
- Memory leaks = restart mid-party

**User Stories:**
```gherkin
As a party host,
I want the scoreboard to start automatically and show the right games,
So that I don't need to configure anything when guests arrive.

As a party host,
I want clear visual indicators if something is wrong,
So that I can troubleshoot before guests notice.

As a party host,
I want a "pre-party validation" tool,
So that I know the system is ready before the event starts.
```

### Secondary Persona: Party Guests
**Role:** Passive viewers, entertainment seekers

**Goals:**
- See live scores at a glance
- Enjoy celebration videos when teams score
- Not distracted by bugs/errors
- Feel the excitement of live sports

**Pain Points (Potential):**
- Can't read scores from across room
- Delayed updates miss context
- Glitchy UI breaks immersion
- Wrong game shown

**User Stories:**
```gherkin
As a party guest,
I want to see all relevant games at once,
So that I don't miss action in other matchups.

As a party guest,
I want celebration videos to play when teams score,
So that I feel the excitement even when not watching TV.

As a party guest,
I want the scoreboard to "just work",
So that I can focus on enjoying the party.
```

---

## 🗺️ FEATURE ROADMAP

### v3.2.1 - "Quick Wins & Security" (Week 1-2)
**Release Date:** 2026-01-30 (2 weeks)
**Theme:** Low-effort, high-impact fixes

**Features:**
1. ✅ **CORS Configuration** - Restrict to LAN (5 min)
2. ✅ **API Rate Limiting** - Protect ESPN quota (30 min)
3. ✅ **Feedback Button** - mailto: link in settings (10 min)
4. ✅ **PM2 Log Rotation** - Prevent disk fill (5 min)
5. ✅ **Non-Root Deployment User** - Security best practice (15 min)
6. ✅ **Error Boundary** - Catch React crashes gracefully (2 hours)

**Success Metrics:**
- Zero security warnings in audit
- Logs stay under 100MB
- React errors show friendly message instead of blank screen

---

### v3.3.0 - "Resilience for Parties" (Week 3-8)
**Release Date:** 2026-03-13 (6 weeks)
**Theme:** Never fail during an event

#### Track 1: Error Handling & Recovery
**User Story:**
```gherkin
As a party host,
I want the app to gracefully handle API failures,
So that guests never see a blank screen during an event.
```

**Features:**
1. ✅ **Exponential Backoff for ESPN API** (1 week)
   - Retry failed requests: 2s → 5s → 15s → 60s
   - Circuit breaker after 3 consecutive failures
   - Fallback to cached data with "Last updated X mins ago" banner

   **Acceptance Criteria:**
   - [ ] ESPN API 503 error → App shows cached data within 2s
   - [ ] Error banner displays with timestamp
   - [ ] Auto-recovery when API returns (green checkmark animation)

2. ✅ **Offline Mode / Stale Data Strategy** (1 week)
   - Save last successful API response to localStorage
   - On API failure: Show stale data + warning banner
   - Background retry every 30s until success

   **Acceptance Criteria:**
   - [ ] Network disconnected → Shows last known state immediately
   - [ ] Banner: "Using cached data from [time]" with orange color
   - [ ] Automatically resumes live updates when network returns

3. ✅ **Request Timeout Configuration** (2 days)
   - All fetch() calls: 10-second timeout
   - AbortController to cancel stale requests
   - Loading indicators for slow responses

   **Acceptance Criteria:**
   - [ ] API request > 10s → Timeout error, retry
   - [ ] Switching sports cancels pending requests
   - [ ] No memory leaks from abandoned fetches

4. ✅ **Better Loading States** (3 days)
   - Skeleton screens during initial load
   - Shimmer effect for game cards
   - "Fetching latest scores..." overlay
   - Progress bar for plugin loading

   **Acceptance Criteria:**
   - [ ] First load shows skeleton, not blank screen
   - [ ] Plugin switch shows progress (0-100%)
   - [ ] Network slow (3G) → Clear loading feedback

#### Track 2: Memory & Performance
**User Story:**
```gherkin
As a party host,
I want the app to run for 12+ hours without issues,
So that I can host all-day football marathons worry-free.
```

**Features:**
5. ✅ **LRU Cache with Size Limits** (1 week)
   - Replace unbounded Map with LRU cache
   - Max size: 100MB per proxy (ESPN, OpenLigaDB)
   - Eviction policy: Least Recently Used
   - Expose cache metrics in /api/health

   **Acceptance Criteria:**
   - [ ] Cache never exceeds 100MB
   - [ ] /api/health shows: { cacheSize: 45MB, entries: 127, hitRate: 0.87 }
   - [ ] Old entries evicted automatically

6. ✅ **Fix setTimeout Cleanup in useScoreChange** (2 days)
   - Add useEffect cleanup for celebration timeout
   - Clear timers on component unmount
   - Track active timeouts in ref

   **Acceptance Criteria:**
   - [ ] Component unmount → No lingering timeouts
   - [ ] Rapid score changes → Only latest timeout runs
   - [ ] Memory profiler shows no leaks after 1000 score updates

7. ✅ **Graceful Shutdown Handler** (2 days)
   - Handle SIGTERM signal in Express
   - Close active connections before exit
   - Wait max 5s, then force shutdown

   **Acceptance Criteria:**
   - [ ] PM2 restart → Active requests complete gracefully
   - [ ] No "connection reset" errors during deployment
   - [ ] Health check passes within 3s of restart

**Success Metrics for v3.3.0:**
- 24-hour soak test: Memory stays under 150MB
- ESPN API failure → Recovers automatically within 60s
- Zero crashes during 8-hour simulated party
- Deployment during active use: < 3s downtime

---

### v3.4.0 - "Quality Infrastructure" (Week 9-16)
**Release Date:** 2026-05-08 (8 weeks)
**Theme:** Testing, CI/CD, DevOps maturity

#### Track 3A: Automated Testing
**User Story:**
```gherkin
As a developer (party host),
I want automated tests that catch bugs before deployment,
So that I never deploy broken code before a big event.
```

**Milestones:**

**Week 9-10: Test Infrastructure Setup**
1. ✅ Install Vitest + Testing Library + MSW
2. ✅ Configure test environment (jsdom, mocks)
3. ✅ Create fixture data (ESPN responses, game states)
4. ✅ Write first 20 unit tests (scoreDetector.ts, stores)

**Week 11-12: Critical Path Testing**
5. ✅ useScoreChange tests (25 tests including edge cases)
6. ✅ useGameData tests (20 tests for polling logic)
7. ✅ Plugin loading tests (15 tests for lazy loading)
8. ✅ API proxy caching tests (10 tests for TTL/eviction)
9. ✅ Target: 60% code coverage

**Week 13-14: Integration Testing**
10. ✅ Full data flow tests (API → Store → UI, 10 tests)
11. ✅ Multi-sport switching tests (5 tests)
12. ✅ Error recovery tests (8 tests)
13. ✅ Target: 70% coverage

**Week 15-16: E2E Testing**
14. ✅ Playwright setup for iPad Mini 6 simulator
15. ✅ Party scenarios: 8-hour marathon, dual-game viewing
16. ✅ Visual regression baseline (6 key screens)
17. ✅ Performance benchmarks (load time, memory usage)
18. ✅ Target: 75% coverage, all E2E pass

**Success Metrics:**
- 75% code coverage (overall)
- 90% coverage on party-critical paths
- 185 total tests (140 unit, 20 integration, 15 E2E, 10 visual)
- CI runs in < 5 minutes

#### Track 3B: CI/CD Pipeline
**User Story:**
```gherkin
As a developer,
I want automated deployment with rollback capability,
So that I can deploy confidently without manual SSH commands.
```

**Features:**
19. ✅ **GitHub Actions CI Workflow** (Week 9)
    - Lint + TypeScript check on every push
    - Run tests on PR
    - Build validation
    - Coverage reporting to Codecov

20. ✅ **Automated Deployment Workflow** (Week 10)
    - Trigger: Manual or on tag (v3.4.0)
    - SSH to server → Pull → Build → Health check → Restart
    - Auto-rollback if health check fails
    - Slack/Email notification on success/failure

21. ✅ **Docker Containerization** (Week 11-12)
    - Multi-stage Dockerfile (build + production)
    - docker-compose for local testing
    - PM2 in container mode
    - Volume mounts for logs

22. ✅ **Pre-Party Validation Script** (Week 13)
    ```bash
    ./pre-party-check.sh
    - ✓ Server uptime > 1 hour
    - ✓ Memory usage < 200M
    - ✓ ESPN API responding (3 successful requests)
    - ✓ All plugins load successfully
    - ✓ Cache populated
    - ✓ Disk usage < 80%
    - ✓ No errors in last 100 log lines
    ```

#### Track 3C: Monitoring & Observability
23. ✅ **UptimeRobot External Monitoring** (Week 10)
    - Monitor /api/health every 5 minutes
    - Email alerts on downtime
    - Status page for event health

24. ✅ **Enhanced Health Endpoint** (Week 11)
    ```json
    {
      "status": "healthy",
      "uptime": 43200,
      "memory": { "used": 145MB, "limit": 500MB },
      "cache": { "espn": { "size": 45MB, "entries": 127 }, ... },
      "apis": { "espn": "ok", "openligadb": "ok" },
      "lastUpdate": "2026-01-16T18:45:23Z"
    }
    ```

25. ✅ **Nginx Reverse Proxy** (Week 14)
    - Bind Express to 127.0.0.1:3001
    - Nginx on port 80
    - SSL with self-signed cert (optional)
    - Access logs for analytics

**Success Metrics v3.4.0:**
- CI pipeline green (all tests pass)
- Deployment: Fully automated, < 30s downtime
- Monitoring: 5-minute detection of issues
- Pre-party script: 100% pass rate before events

---

### v4.0.0 - "Advanced Features" (Month 5-6)
**Release Date:** 2026-07-15 (6 months out)
**Theme:** Next-level party experience

**Features (Speculative):**
1. ✅ **Apple TV Support** (via Capacitor/React Native)
   - Native tvOS app
   - Siri Remote navigation
   - 4K display optimization
   - Auto-start on TV power-on

2. ✅ **Multi-Device Sync** (Optional)
   - iPad control panel + TV display
   - WebSocket for real-time sync
   - Settings sync across devices

3. ✅ **Advanced Visualizations**
   - Game timelines with key plays
   - Live stats charts
   - Interactive bracket (click to zoom)
   - Custom celebration video uploads

4. ✅ **Analytics Dashboard**
   - Most-watched sports
   - Peak usage times
   - Popular games
   - Party event history

**Decision Point:** Re-evaluate in Month 4 based on v3.4 success

---

## 🔒 SECURITY REQUIREMENTS

**Threat Model:** Private network deployment, low external threat, focus on operational security and good practices.

### Critical Requirements (Even for Private Use)
1. ✅ **API Key Protection**
   - API-Football key ONLY in server .env file
   - Never exposed in client bundle
   - Verify with `grep -r "VITE_API" dist/` → 0 results

2. ✅ **Rate Limiting**
   - ESPN: 100 requests per 15 minutes per IP
   - OpenLigaDB: Respect 1000 req/hour limit
   - API-Football: Stay under 100 req/day free tier

3. ✅ **Input Validation**
   - Game IDs: Must match `/^[0-9]+$/`
   - Query params: Sanitize year, week, seasonType
   - Prevent SSRF via malicious IDs

### Important Best Practices
4. ✅ **CORS Configuration**
   ```typescript
   app.use(cors({
     origin: ['http://10.1.0.51:3001', 'http://localhost:5173'],
     methods: ['GET']
   }));
   ```

5. ✅ **Security Headers** (via Helmet)
   - Content-Security-Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

6. ✅ **Non-Root Deployment**
   - Create `scoreboard-app` user
   - Deploy as non-root
   - PM2 runs as service user

---

## ⚠️ RISK ANALYSIS & MITIGATION

### Nightmare Scenario Matrix

| Scenario | Impact | Probability | Mitigation | Priority |
|----------|--------|-------------|------------|----------|
| **Super Bowl Day API Failure** | CRITICAL | Medium | Circuit breaker + cached data fallback | P0 |
| **Memory Leak During Marathon** | HIGH | High | LRU cache + memory monitoring + auto-restart at 400M | P0 |
| **Broken Deployment Before Party** | CRITICAL | Low | Pre-deploy validation + rollback script + 24h advance deploy | P0 |
| **Wrong Game Auto-Selected** | MEDIUM | Medium | Manual override always available + clear game indicator | P1 |
| **Network Congestion** | MEDIUM | High | Request timeout (10s) + exponential backoff | P0 |

### Pre-Party Validation Checklist
**Run 1 hour before event starts:**
```bash
./pre-party-check.sh

Checking system readiness...
✓ Server uptime: 25 hours (healthy)
✓ Memory usage: 142MB / 500MB (28%)
✓ ESPN API: Responding (avg 245ms)
✓ Cache populated: 3 plugins, 24 games cached
✓ All plugins load: NFL, Bundesliga, UEFA (3/3)
✓ Video assets preloaded: 12 videos ready
✓ Disk usage: 45% (healthy)

🎉 System ready for party! Status: GREEN
```

---

## 📈 TIMELINE & MILESTONES

### 3-Track Parallel Development (12 Weeks)

```
Week  Track 1: Quick Wins    Track 2: Resilience        Track 3: Quality
────────────────────────────────────────────────────────────────────────
1-2   🟢 v3.2.1 Release      Planning                   Planning
      (Security & Fixes)

3-4   ---                    Error Handling             Test Setup
                             - Retry Logic              - Vitest Install
                             - Offline Mode             - MSW Mocks

5-6   ---                    Memory Fixes               Unit Tests (P1)
                             - LRU Cache                - 55 tests written
                             - setTimeout cleanup       - 40% coverage

7-8   ---                    🟡 v3.3.0 Release         Unit Tests (P2+3)
                             (Resilience)               - 140 tests total
                                                        - 60% coverage

9-10  ---                    ---                        CI/CD Setup
                                                        - GitHub Actions
                                                        - Deployment

11-12 ---                    ---                        Integration Tests
                                                        - 20 tests
                                                        - 70% coverage

13-14 ---                    ---                        E2E Tests
                                                        - Playwright
                                                        - Visual Regression

15-16 ---                    ---                        🟢 v3.4.0 Release
                                                        (Quality)
```

---

## ✅ NEXT ACTIONS

### Immediate (This Week)
1. ✅ Review and approve this PRD
2. ✅ Create GitHub Project board with all user stories
3. ✅ Start Track 1 (Quick Wins) - v3.2.1
   - CORS configuration
   - Rate limiting
   - Feedback button
   - PM2 log rotation
   - Non-root user setup
   - Error boundary

---

**END OF PRD**

*Last Updated: 2026-01-16*
*Next Review: After v3.2.1 deployment*
