/**
 * LoadingSkeleton Component Tests
 *
 * Tests Track 2 loading state features:
 * - Skeleton components render correctly
 * - Shimmer animation is present
 * - Proper structure matches actual UI
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MainScoreboardSkeleton,
  GameCardSkeleton,
  GameListSkeleton,
  StatsPanelSkeleton,
} from '../LoadingSkeleton';

describe('LoadingSkeleton - MainScoreboard', () => {
  it('should render main scoreboard skeleton', () => {
    const { container } = render(<MainScoreboardSkeleton />);
    expect(container).toBeTruthy();
  });

  it('should show loading text', () => {
    render(<MainScoreboardSkeleton />);
    expect(screen.getByText(/Lade Spieldaten/i)).toBeTruthy();
  });

  it('should have shimmer animation elements', () => {
    const { container } = render(<MainScoreboardSkeleton />);
    const shimmerElements = container.querySelectorAll('.animate-shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('should have correct layout structure', () => {
    const { container } = render(<MainScoreboardSkeleton />);

    // Should have grid layout for teams and score
    const gridLayout = container.querySelector('.grid.grid-cols-\\[1fr_auto_1fr\\]');
    expect(gridLayout).toBeTruthy();
  });

  it('should render team logo placeholders', () => {
    const { container } = render(<MainScoreboardSkeleton />);

    // Should have team logo skeletons (circular elements)
    const logoPlaceholders = container.querySelectorAll('.rounded-full');
    expect(logoPlaceholders.length).toBeGreaterThan(0);
  });

  it('should render score box placeholders', () => {
    const { container } = render(<MainScoreboardSkeleton />);

    // Should have score boxes (rounded-xl elements)
    const scoreBoxes = container.querySelectorAll('.rounded-xl');
    expect(scoreBoxes.length).toBeGreaterThan(0);
  });

  it('should have spinning loader icon', () => {
    const { container } = render(<MainScoreboardSkeleton />);

    // Should have spinning animation
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should have background gradient', () => {
    const { container } = render(<MainScoreboardSkeleton />);
    const mainElement = container.firstElementChild;

    expect(mainElement).toBeTruthy();
    expect(mainElement?.getAttribute('style')).toContain('gradient');
  });
});

describe('LoadingSkeleton - GameCard', () => {
  it('should render game card skeleton', () => {
    const { container } = render(<GameCardSkeleton />);
    expect(container).toBeTruthy();
  });

  it('should have card styling', () => {
    const { container } = render(<GameCardSkeleton />);
    const card = container.querySelector('.bg-slate-800\\/50');
    expect(card).toBeTruthy();
  });

  it('should have shimmer elements', () => {
    const { container } = render(<GameCardSkeleton />);
    const shimmerElements = container.querySelectorAll('.animate-shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('should have team logo placeholders', () => {
    const { container } = render(<GameCardSkeleton />);
    const logos = container.querySelectorAll('.rounded-full');
    // Should have 2 team logos
    expect(logos.length).toBeGreaterThanOrEqual(2);
  });
});

describe('LoadingSkeleton - GameList', () => {
  it('should render default 4 game cards', () => {
    const { container } = render(<GameListSkeleton />);
    const cards = container.querySelectorAll('.bg-slate-800\\/50');
    expect(cards.length).toBe(4);
  });

  it('should render custom number of cards', () => {
    const { container } = render(<GameListSkeleton count={6} />);
    const cards = container.querySelectorAll('.bg-slate-800\\/50');
    expect(cards.length).toBe(6);
  });

  it('should have grid layout', () => {
    const { container } = render(<GameListSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });
});

describe('LoadingSkeleton - StatsPanel', () => {
  it('should render stats panel skeleton', () => {
    const { container } = render(<StatsPanelSkeleton />);
    expect(container).toBeTruthy();
  });

  it('should have multiple stat rows', () => {
    const { container } = render(<StatsPanelSkeleton />);
    const statRows = container.querySelectorAll('.flex.items-center.gap-4');
    // Should have 6 stat rows
    expect(statRows.length).toBeGreaterThanOrEqual(6);
  });

  it('should have team logo placeholders in header', () => {
    const { container } = render(<StatsPanelSkeleton />);
    const logos = container.querySelectorAll('.rounded-full');
    // Should have 2 team logos in header
    expect(logos.length).toBeGreaterThanOrEqual(2);
  });

  it('should have shimmer elements', () => {
    const { container } = render(<StatsPanelSkeleton />);
    const shimmerElements = container.querySelectorAll('.animate-shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });
});

describe('LoadingSkeleton - Accessibility', () => {
  it('should have accessible structure for screen readers', () => {
    const { container } = render(<MainScoreboardSkeleton />);

    // Loading text should be present and readable
    const loadingText = screen.getByText(/Lade Spieldaten/i);
    expect(loadingText).toBeTruthy();
  });

  it('should not have interactive elements', () => {
    const { container } = render(<MainScoreboardSkeleton />);

    // Skeleton should not have buttons, links, or inputs
    const buttons = container.querySelectorAll('button');
    const links = container.querySelectorAll('a');
    const inputs = container.querySelectorAll('input');

    expect(buttons.length).toBe(0);
    expect(links.length).toBe(0);
    expect(inputs.length).toBe(0);
  });
});

describe('LoadingSkeleton - Animation Classes', () => {
  it('should have shimmer animation class', () => {
    const { container } = render(<MainScoreboardSkeleton />);
    const shimmer = container.querySelector('.animate-shimmer');
    expect(shimmer).toBeTruthy();
  });

  it('should have spin animation for loader', () => {
    const { container } = render(<MainScoreboardSkeleton />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should have gradient animation in shimmer', () => {
    const { container } = render(<MainScoreboardSkeleton />);
    const gradient = container.querySelector('.bg-gradient-to-r');
    expect(gradient).toBeTruthy();
  });
});
