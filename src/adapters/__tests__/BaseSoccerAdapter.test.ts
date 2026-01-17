/**
 * BaseSoccerAdapter Tests
 *
 * Tests for the BaseSoccerAdapter class, focusing on:
 * - Score change detection with celebration type determination
 * - Clock calculation (match minute estimation, period detection)
 * - Game status determination (scheduled, in_progress, halftime, final, postponed)
 * - Team transformation with logo fallback
 * - Display value building (e.g., "45'", "45+3'", "90+2'")
 * - Extra time handling for tournaments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseSoccerAdapter, type OpenLigaDBMatchBase } from '../BaseSoccerAdapter';
import type { Game } from '../../types/game';
import type { GameStats } from '../../types/stats';

// Concrete test implementation of abstract BaseSoccerAdapter
class TestSoccerAdapter extends BaseSoccerAdapter {
  sport = 'test-soccer';
  teamColors: Record<number, string> = {
    7: 'DC052D', // Bayern
    9: 'FDE100', // Dortmund
  };
  defaultColor = '000000';
  canHaveExtraTime = false;

  async fetchScoreboard(): Promise<Game[]> {
    return [];
  }

  async fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }> {
    return {
      game: {} as Game,
      stats: null,
    };
  }

  getCompetitionName(game: Game): string {
    return 'Test Soccer';
  }
}

// Concrete implementation for tournaments (with extra time)
class TournamentSoccerAdapter extends TestSoccerAdapter {
  canHaveExtraTime = true;
}

// Helper to create OpenLigaDB match
const createOpenLigaDBMatch = (
  matchID: number,
  matchDateTime: string,
  matchIsFinished: boolean,
  pointsTeam1: number,
  pointsTeam2: number,
  goals: Array<{
    goalID: number;
    matchMinute: number;
    goalGetterName: string;
    scoreTeam1: number;
    scoreTeam2: number;
    isPenalty?: boolean;
    isOwnGoal?: boolean;
  }> = []
): OpenLigaDBMatchBase => ({
  matchID,
  matchDateTime,
  matchDateTimeUTC: matchDateTime,
  matchIsFinished,
  lastUpdateDateTime: matchDateTime,
  team1: {
    teamId: 7,
    teamName: 'Bayern München',
    shortName: 'FCB',
    teamIconUrl: 'https://example.com/bayern.png',
  },
  team2: {
    teamId: 9,
    teamName: 'Borussia Dortmund',
    shortName: 'BVB',
    teamIconUrl: 'https://example.com/bvb.png',
  },
  matchResults: [
    {
      resultTypeID: 2, // Final result
      pointsTeam1,
      pointsTeam2,
    },
  ],
  goals,
  group: {
    groupName: 'Matchday 18',
    groupOrderID: 18,
  },
  location: {
    locationCity: 'München',
    locationStadium: 'Allianz Arena',
  },
});

describe('BaseSoccerAdapter - Score Change Detection', () => {
  let adapter: TestSoccerAdapter;

  beforeEach(() => {
    adapter = new TestSoccerAdapter();
  });

  it('should detect no score change', () => {
    const game = {} as Game;
    const result = adapter.detectScoreChange(2, 1, 2, 1, game);

    expect(result).toBeNull();
  });

  it('should detect home team score increase', () => {
    const game = {
      goals: [
        { goalID: 1, minute: 23, scorerName: 'Müller', isPenalty: false, isOwnGoal: false },
      ],
    } as any;

    const result = adapter.detectScoreChange(1, 0, 2, 0, game);

    expect(result).not.toBeNull();
    expect(result?.team).toBe('home');
    expect(result?.type).toBe('goal');
  });

  it('should detect away team score increase', () => {
    const game = {
      goals: [
        { goalID: 1, minute: 15, scorerName: 'Haaland', isPenalty: false, isOwnGoal: false },
      ],
    } as any;

    const result = adapter.detectScoreChange(0, 0, 0, 1, game);

    expect(result).not.toBeNull();
    expect(result?.team).toBe('away');
    expect(result?.type).toBe('goal');
  });

  it('should detect penalty goal', () => {
    const game = {
      goals: [
        { goalID: 1, minute: 45, scorerName: 'Lewandowski', isPenalty: true, isOwnGoal: false },
      ],
    } as any;

    const result = adapter.detectScoreChange(2, 1, 3, 1, game);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('penalty');
  });

  it('should detect own goal', () => {
    const game = {
      goals: [
        { goalID: 1, minute: 67, scorerName: 'Müller', isPenalty: false, isOwnGoal: true },
      ],
    } as any;

    const result = adapter.detectScoreChange(1, 1, 1, 2, game);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('own_goal');
  });

  it('should handle missing goal data', () => {
    const game = { goals: [] } as any;

    const result = adapter.detectScoreChange(0, 0, 1, 0, game);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('goal'); // Default to regular goal
  });

  it('should handle multiple goals', () => {
    const game = {
      goals: [
        { goalID: 1, minute: 10, scorerName: 'Player 1', isPenalty: false, isOwnGoal: false },
        { goalID: 2, minute: 25, scorerName: 'Player 2', isPenalty: true, isOwnGoal: false },
        { goalID: 3, minute: 67, scorerName: 'Player 3', isPenalty: false, isOwnGoal: false },
      ],
    } as any;

    const result = adapter.detectScoreChange(2, 0, 3, 0, game);

    // Should use LATEST goal (penalty at 25')
    expect(result?.type).toBe('goal'); // Latest is regular goal at 67'
  });
});

describe('BaseSoccerAdapter - Game Status Determination', () => {
  let adapter: TestSoccerAdapter;

  beforeEach(() => {
    adapter = new TestSoccerAdapter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should detect finished games', () => {
    const match = createOpenLigaDBMatch(
      1,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      true, // matchIsFinished
      2,
      1
    );

    const status = (adapter as any).determineGameStatus(match);

    expect(status).toBe('final');
  });

  it('should detect scheduled games (future kickoff)', () => {
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
    const match = createOpenLigaDBMatch(1, futureTime, false, 0, 0);

    const status = (adapter as any).determineGameStatus(match);

    expect(status).toBe('scheduled');
  });

  it('should detect in_progress games (within 45 min)', () => {
    const kickoff = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago
    const match = createOpenLigaDBMatch(1, kickoff, false, 0, 0, [
      { goalID: 1, matchMinute: 15, goalGetterName: 'Player', scoreTeam1: 1, scoreTeam2: 0 },
    ]);

    const status = (adapter as any).determineGameStatus(match);

    expect(status).toBe('in_progress');
  });

  it('should detect halftime (45-60 min elapsed)', () => {
    const kickoff = new Date(Date.now() - 50 * 60 * 1000).toISOString(); // 50 min ago
    const match = createOpenLigaDBMatch(1, kickoff, false, 1, 0);

    const status = (adapter as any).determineGameStatus(match);

    expect(status).toBe('halftime');
  });

  it('should detect in_progress for second half (60-107 min)', () => {
    const kickoff = new Date(Date.now() - 75 * 60 * 1000).toISOString(); // 75 min ago
    const match = createOpenLigaDBMatch(1, kickoff, false, 2, 1, [
      { goalID: 1, matchMinute: 60, goalGetterName: 'Player', scoreTeam1: 2, scoreTeam2: 1 },
    ]);

    const status = (adapter as any).determineGameStatus(match);

    expect(status).toBe('in_progress');
  });

  it('should detect postponed games (>2 hours, no data)', () => {
    const kickoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
    const match: OpenLigaDBMatchBase = {
      ...createOpenLigaDBMatch(1, kickoff, false, 0, 0),
      matchResults: [], // No results
      goals: [], // No goals
    };

    const status = (adapter as any).determineGameStatus(match);

    expect(status).toBe('postponed');
  });

  it('should NOT mark as postponed if goals exist', () => {
    const kickoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const match = createOpenLigaDBMatch(1, kickoff, false, 1, 0, [
      { goalID: 1, matchMinute: 10, goalGetterName: 'Player', scoreTeam1: 1, scoreTeam2: 0 },
    ]);

    const status = (adapter as any).determineGameStatus(match);

    // Should be in_progress, not postponed
    expect(status).not.toBe('postponed');
  });
});

describe('BaseSoccerAdapter - Clock Building', () => {
  let adapter: TestSoccerAdapter;

  beforeEach(() => {
    adapter = new TestSoccerAdapter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should build clock for scheduled game', () => {
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    const match = createOpenLigaDBMatch(1, futureTime, false, 0, 0);

    const clock = (adapter as any).buildClock(match, []);

    expect(clock.matchMinute).toBe(0);
    expect(clock.period).toBe('first_half');
    expect(clock.displayValue).toBe("0'");
  });

  it('should estimate first half time (0-45 min)', () => {
    const kickoff = new Date(Date.now() - 25 * 60 * 1000).toISOString(); // 25 min ago
    const match = createOpenLigaDBMatch(1, kickoff, false, 0, 0);

    const clock = (adapter as any).buildClock(match, []);

    expect(clock.matchMinute).toBe(25);
    expect(clock.period).toBe('first_half');
    expect(clock.displayValue).toBe("25'");
  });

  it('should show halftime period', () => {
    const kickoff = new Date(Date.now() - 50 * 60 * 1000).toISOString(); // 50 min ago
    const match = createOpenLigaDBMatch(1, kickoff, false, 1, 0);

    const clock = (adapter as any).buildClock(match, []);

    expect(clock.period).toBe('halftime');
    expect(clock.displayValue).toBe("45'");
  });

  it('should estimate second half time (62-107 min elapsed)', () => {
    const kickoff = new Date(Date.now() - 80 * 60 * 1000).toISOString(); // 80 min ago
    const match = createOpenLigaDBMatch(1, kickoff, false, 2, 1);

    const clock = (adapter as any).buildClock(match, []);

    // 80 real minutes - 62 (first half + halftime) = 18 match minutes into second half = 63'
    expect(clock.matchMinute).toBe(63);
    expect(clock.period).toBe('second_half');
    expect(clock.displayValue).toBe("63'");
  });

  it('should use goal minute when available', () => {
    const kickoff = new Date(Date.now() - 50 * 60 * 1000).toISOString();
    const goals = [
      {
        goalId: 1,
        minute: 42,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 1, away: 0 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, false, 1, 0, [
      { goalID: 1, matchMinute: 42, goalGetterName: 'Player', scoreTeam1: 1, scoreTeam2: 0 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    // Should use goal minute (42) even if elapsed time suggests different
    expect(clock.matchMinute).toBeGreaterThanOrEqual(42);
    expect(clock.period).toBe('first_half');
  });

  it('should show stoppage time for first half (45+X)', () => {
    const kickoff = new Date(Date.now() - 50 * 60 * 1000).toISOString();
    const goals = [
      {
        goalId: 1,
        minute: 48,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 1, away: 0 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, false, 1, 0, [
      { goalID: 1, matchMinute: 48, goalGetterName: 'Player', scoreTeam1: 1, scoreTeam2: 0 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    expect(clock.matchMinute).toBe(48);
    expect(clock.displayValue).toBe("45+3'");
  });

  it('should show stoppage time for second half (90+X)', () => {
    const kickoff = new Date(Date.now() - 120 * 60 * 1000).toISOString(); // 120 min ago
    const goals = [
      {
        goalId: 1,
        minute: 93,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 2, away: 1 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, false, 2, 1, [
      { goalID: 1, matchMinute: 93, goalGetterName: 'Player', scoreTeam1: 2, scoreTeam2: 1 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    expect(clock.matchMinute).toBe(93);
    expect(clock.displayValue).toBe("90+3'");
  });

  it('should show final time for finished game', () => {
    const kickoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const match = createOpenLigaDBMatch(1, kickoff, true, 2, 1);

    const clock = (adapter as any).buildClock(match, []);

    expect(clock.matchMinute).toBe(90);
    expect(clock.period).toBe('second_half');
    expect(clock.displayValue).toBe("90'");
  });

  it('should handle finished game with late goal', () => {
    const kickoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const goals = [
      {
        goalId: 1,
        minute: 94,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 3, away: 2 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, true, 3, 2, [
      { goalID: 1, matchMinute: 94, goalGetterName: 'Player', scoreTeam1: 3, scoreTeam2: 2 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    expect(clock.matchMinute).toBe(94);
    expect(clock.displayValue).toBe("90+4'");
  });
});

describe('BaseSoccerAdapter - Extra Time (Tournament)', () => {
  let adapter: TournamentSoccerAdapter;

  beforeEach(() => {
    adapter = new TournamentSoccerAdapter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should detect extra time period', () => {
    const kickoff = new Date(Date.now() - 125 * 60 * 1000).toISOString(); // 125 min ago
    const goals = [
      {
        goalId: 1,
        minute: 105,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 2, away: 1 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, false, 2, 1, [
      { goalID: 1, matchMinute: 105, goalGetterName: 'Player', scoreTeam1: 2, scoreTeam2: 1 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    expect(clock.period).toBe('extra_time');
    expect(clock.matchMinute).toBe(105);
  });

  it('should show extra time stoppage (120+X)', () => {
    const kickoff = new Date(Date.now() - 150 * 60 * 1000).toISOString();
    const goals = [
      {
        goalId: 1,
        minute: 123,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 3, away: 2 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, true, 3, 2, [
      { goalID: 1, matchMinute: 123, goalGetterName: 'Player', scoreTeam1: 3, scoreTeam2: 2 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    expect(clock.matchMinute).toBe(123);
    expect(clock.displayValue).toBe("120+3'");
  });

  it('should show finished extra time game', () => {
    const kickoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const goals = [
      {
        goalId: 1,
        minute: 115,
        scorerName: 'Player',
        scorerTeam: 'home' as const,
        isPenalty: false,
        isOwnGoal: false,
        scoreAfter: { home: 2, away: 1 },
      },
    ];
    const match = createOpenLigaDBMatch(1, kickoff, true, 2, 1, [
      { goalID: 1, matchMinute: 115, goalGetterName: 'Player', scoreTeam1: 2, scoreTeam2: 1 },
    ]);

    const clock = (adapter as any).buildClock(match, goals);

    expect(clock.period).toBe('extra_time');
    expect(clock.matchMinute).toBe(115);
  });
});

describe('BaseSoccerAdapter - Team Transformation', () => {
  let adapter: TestSoccerAdapter;

  beforeEach(() => {
    adapter = new TestSoccerAdapter();
  });

  it('should transform team with correct properties', () => {
    const oldbTeam = {
      teamId: 7,
      teamName: 'Bayern München',
      shortName: 'FCB',
      teamIconUrl: 'https://example.com/bayern.png',
    };

    const team = (adapter as any).transformTeam(oldbTeam, 3);

    expect(team.id).toBe('7');
    expect(team.name).toBe('Bayern München');
    expect(team.abbreviation).toBe('FCB');
    expect(team.displayName).toBe('Bayern München');
    expect(team.shortDisplayName).toBe('FCB');
    expect(team.score).toBe(3);
    expect(team.color).toBe('DC052D'); // From teamColors
  });

  it('should use default color for unknown team', () => {
    const oldbTeam = {
      teamId: 999,
      teamName: 'Unknown Team',
      shortName: 'UNK',
      teamIconUrl: 'https://example.com/unknown.png',
    };

    const team = (adapter as any).transformTeam(oldbTeam, 0);

    expect(team.color).toBe('000000'); // Default color
  });

  it('should set alternateColor to white', () => {
    const oldbTeam = {
      teamId: 7,
      teamName: 'Bayern München',
      shortName: 'FCB',
      teamIconUrl: 'https://example.com/bayern.png',
    };

    const team = (adapter as any).transformTeam(oldbTeam, 2);

    expect(team.alternateColor).toBe('FFFFFF');
  });
});

describe('BaseSoccerAdapter - Period Names', () => {
  let adapter: TestSoccerAdapter;

  beforeEach(() => {
    adapter = new TestSoccerAdapter();
  });

  it('should return German period names', () => {
    expect(adapter.getPeriodName('first_half')).toBe('1. Halbzeit');
    expect(adapter.getPeriodName('second_half')).toBe('2. Halbzeit');
    expect(adapter.getPeriodName('halftime')).toBe('Halbzeit');
    expect(adapter.getPeriodName('extra_time')).toBe('Verlängerung');
  });

  it('should return empty string for unknown period', () => {
    expect(adapter.getPeriodName('unknown' as any)).toBe('');
  });
});

describe('BaseSoccerAdapter - Celebration Types', () => {
  let adapter: TestSoccerAdapter;

  beforeEach(() => {
    adapter = new TestSoccerAdapter();
  });

  it('should return correct celebration types', () => {
    const types = adapter.getCelebrationTypes();

    expect(types).toContain('goal');
    expect(types).toContain('penalty');
    expect(types).toContain('own_goal');
    expect(types).toContain('red_card');
    expect(types).toContain('yellow_red_card');
  });
});
