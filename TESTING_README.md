# Testing Infrastructure Guide

This document explains how to use the comprehensive test suite for the Sport Scoreboard application.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in CI mode (single run)
npm run test:run

# Run tests with UI (interactive)
npm run test:ui

# Run with coverage report
npm run test:coverage
```

## Test Structure

```
ScoreBoard/
├── server/
│   ├── services/__tests__/
│   │   ├── espnProxy.test.ts      # Backend resilience tests
│   │   └── cache.test.ts          # LRU cache tests
│   └── __tests__/
│       └── gracefulShutdown.test.ts
├── src/
│   ├── services/__tests__/
│   │   └── cacheService.test.ts   # Frontend cache tests
│   ├── components/__tests__/
│   │   └── LoadingSkeleton.test.tsx
│   ├── hooks/__tests__/
│   │   └── useScoreChange.test.ts
│   └── test/
│       └── setup.ts               # Test configuration
├── vitest.config.ts               # Vitest configuration
├── TEST_REPORT.md                 # Detailed test report
└── TESTING_SUMMARY.md             # Quick summary
```

## Test Categories

### Backend Tests

#### 1. ESPN Proxy Tests (`server/services/__tests__/espnProxy.test.ts`)
Tests resilience features for ESPN API integration:
- Exponential backoff retry (2s → 5s → 15s → 60s)
- Circuit breaker (CLOSED → OPEN → HALF_OPEN → CLOSED)
- Request timeout (10 seconds)
- Stale cache fallback
- Request cancellation (AbortController)

**Run specific tests:**
```bash
npm test espnProxy
```

#### 2. Cache Tests (`server/services/__tests__/cache.test.ts`)
Tests LRU cache implementation:
- Memory-based eviction (100MB limit)
- Hit/miss tracking
- TTL expiration
- Size calculation

**Run specific tests:**
```bash
npm test cache.test
```

#### 3. Graceful Shutdown Tests (`server/__tests__/gracefulShutdown.test.ts`)
Tests server shutdown behavior:
- SIGTERM/SIGINT handling
- Active request completion
- Force shutdown after 5s timeout

**Run specific tests:**
```bash
npm test gracefulShutdown
```

### Frontend Tests

#### 4. Cache Service Tests (`src/services/__tests__/cacheService.test.ts`)
Tests localStorage-based caching:
- Scoreboard caching (24h TTL)
- Game details caching (1h TTL)
- Cache expiry
- Error handling (quota exceeded, corrupted data)

**Run specific tests:**
```bash
npm test cacheService
```

#### 5. Loading Skeleton Tests (`src/components/__tests__/LoadingSkeleton.test.tsx`)
Tests loading state components:
- Skeleton rendering
- Shimmer animations
- Layout structure
- Accessibility

**Run specific tests:**
```bash
npm test LoadingSkeleton
```

#### 6. useScoreChange Tests (`src/hooks/__tests__/useScoreChange.test.ts`)
Tests score change detection and cleanup:
- setTimeout cleanup on unmount
- Rapid score changes
- Memory leak prevention

**Run specific tests:**
```bash
npm test useScoreChange
```

## Writing New Tests

### Backend Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Frontend Component Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
```

### Hook Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return correct value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBe('expected');
  });
});
```

## Mocking

### Mock fetch
```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock' }),
  } as Response)
);
```

### Mock localStorage
Already configured in `src/test/setup.ts`. Use normally in tests:
```typescript
localStorage.setItem('key', 'value');
expect(localStorage.getItem('key')).toBe('value');
```

### Mock timers
```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// In test
vi.advanceTimersByTime(5000); // Fast-forward 5 seconds
```

## Coverage Reports

Generate HTML coverage report:
```bash
npm run test:coverage
```

View report:
```bash
# Open in browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

Coverage goals:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## CI/CD Integration

Add to GitHub Actions:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:run
```

## Debugging Tests

### Run single test
```bash
npm test -- -t "should retry with exponential backoff"
```

### Run with verbose output
```bash
npm run test:run -- --reporter=verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Issue: Tests timeout
**Solution:** Increase timeout in `vitest.config.ts`:
```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Issue: Fake timers not advancing
**Solution:** Use `vi.advanceTimersByTimeAsync()` instead of `vi.advanceTimersByTime()` for promises:
```typescript
await vi.advanceTimersByTimeAsync(5000);
```

### Issue: Module not found
**Solution:** Check path alias in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: Store mocking not working
**Solution:** Use vi.mock at top of file:
```typescript
vi.mock('../stores/gameStore', () => ({
  useGameStore: vi.fn(),
}));
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Clean up** - Use beforeEach/afterEach to reset state
3. **Descriptive names** - Test names should explain what they test
4. **AAA pattern** - Arrange, Act, Assert
5. **Mock external dependencies** - Don't make real API calls
6. **Test edge cases** - Null, undefined, empty, large values
7. **Avoid implementation details** - Test behavior, not internals

## Test Naming Convention

```typescript
describe('[Component/Module Name]', () => {
  describe('[Feature/Method]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test code
    });
  });
});
```

Example:
```typescript
describe('ESPNProxy', () => {
  describe('fetchScoreboard', () => {
    it('should return cached data when cache is fresh', () => {
      // Test code
    });
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Coverage Reports](https://vitest.dev/guide/coverage.html)

---

**Questions?** Check `TEST_REPORT.md` for detailed findings and recommendations.

**Chookity!** Happy testing! 🧪
