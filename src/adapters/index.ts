// Adapter Factory - Central access point for sport adapters

import type { SportAdapter } from './SportAdapter';
import { NFLAdapter } from './nflAdapter';
import { BundesligaAdapter } from './bundesligaAdapter';
import type { SportType } from '../types/base';

const adapters: Record<SportType, SportAdapter> = {
  nfl: new NFLAdapter(),
  bundesliga: new BundesligaAdapter(),
};

export function getSportAdapter(sport: SportType): SportAdapter {
  return adapters[sport];
}

export { NFLAdapter, BundesligaAdapter };
export type { SportAdapter };
