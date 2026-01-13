import type { SportAdapter, ScoreChangeResult } from '../../adapters/SportAdapter';
import type { Game, CelebrationType } from '../../types/game';
import type { GameStats } from '../../types/stats';

/**
 * Template Sport Adapter
 *
 * Implementiert das SportAdapter Interface für eine neue Sportart/Liga.
 *
 * TODO: Implementiere alle Methoden für deine Sport-API
 */

export class TemplateSportAdapter implements SportAdapter {
  // TODO: Setze den Sport-Identifier (muss mit manifest.id übereinstimmen)
  sport = 'template-sport' as const;

  /**
   * Lädt alle aktuellen Spiele (Scoreboard)
   *
   * TODO: Implementiere API-Aufruf für deine Sportart
   * - Rufe die API auf (z.B. ESPN, OpenLigaDB, etc.)
   * - Transformiere die Response in das Game-Format
   * - Gib Array von Games zurück
   */
  async fetchScoreboard(): Promise<Game[]> {
    try {
      // TODO: API-URL für deine Sportart
      // Beispiel: const response = await fetch('/api/dein-sport/scoreboard');
      // const data = await response.json();

      // TODO: Transformiere API-Response in Game-Objekte
      // Beispiel:
      // return data.games.map(apiGame => ({
      //   id: apiGame.id,
      //   sport: this.sport,
      //   competition: apiGame.league,
      //   homeTeam: this.transformTeam(apiGame.home),
      //   awayTeam: this.transformTeam(apiGame.away),
      //   status: this.mapGameStatus(apiGame.status),
      //   startTime: apiGame.date,
      //   // ... weitere Felder
      // }));

      console.warn('TemplateSportAdapter.fetchScoreboard() not implemented');
      return [];
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
      throw error;
    }
  }

  /**
   * Lädt Details und Statistiken für ein bestimmtes Spiel
   *
   * TODO: Implementiere API-Aufruf für Game-Details
   * - Rufe die Detail-API auf
   * - Gib Game + Stats zurück
   * - Stats kann null sein, wenn nicht verfügbar
   */
  async fetchGameDetails(_gameId: string): Promise<{ game: Game; stats: GameStats | null }> {
    try {
      // TODO: API-URL für Game-Details
      // Beispiel: const response = await fetch(`/api/dein-sport/game/${gameId}`);
      // const data = await response.json();

      // TODO: Transformiere API-Response
      // Beispiel:
      // const game = this.transformGameData(data.game);
      // const stats = data.stats ? this.transformStats(data.stats) : null;
      // return { game, stats };

      console.warn(`TemplateSportAdapter.fetchGameDetails(${_gameId}) not implemented`);
      throw new Error('Not implemented');
    } catch (error) {
      console.error(`Error fetching game details for ${_gameId}:`, error);
      throw error;
    }
  }

  /**
   * Erkennt Score-Änderungen zwischen zwei Score-Werten
   *
   * TODO: Implementiere Score-Change Detection für Celebration Videos
   * - Vergleiche alte und neue Score-Werte
   * - Erkenne welches Team gepunktet hat (home oder away)
   * - Bestimme den Event-Type (z.B. 'goal', 'touchdown', etc.)
   * - Gib ScoreChangeResult zurück oder null wenn keine Änderung
   */
  detectScoreChange(
    _prevHome: number,
    _prevAway: number,
    _newHome: number,
    _newAway: number,
    _game: Game
  ): ScoreChangeResult | null {
    // TODO: Score-Vergleich implementieren
    // Beispiel für Fußball:
    // const homeScoreDiff = newHome - prevHome;
    // const awayScoreDiff = newAway - prevAway;
    //
    // if (homeScoreDiff > 0) {
    //   return {
    //     type: 'goal', // CelebrationType aus manifest
    //     team: 'home',
    //   };
    // }
    // if (awayScoreDiff > 0) {
    //   return {
    //     type: 'goal',
    //     team: 'away',
    //   };
    // }

    return null; // Keine Score-Änderung
  }

  /**
   * Gibt den Namen einer Spielphase zurück (z.B. "1st Quarter", "1. Halbzeit")
   *
   * TODO: Implementiere Period-Namen für deine Sportart
   */
  getPeriodName(period: number): string {
    // TODO: Anpassen für deine Sportart
    // Beispiele:
    // - NFL: ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'Overtime']
    // - Fußball: ['1. Halbzeit', '2. Halbzeit', 'Verlängerung', 'Elfmeterschießen']
    // - Basketball: ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter']

    const periodNames = ['1st Period', '2nd Period', '3rd Period', '4th Period'];
    return periodNames[period - 1] || `Period ${period}`;
  }

  /**
   * Gibt den Namen des Wettbewerbs zurück
   *
   * TODO: Implementiere Competition-Namen für deine Sportart
   */
  getCompetitionName(game: Game): string {
    // TODO: Anpassen für deine Sportart
    // Beispiel:
    // if (game.competition === 'premier-league') return 'Premier League';
    // if (game.competition === 'fa-cup') return 'FA Cup';

    return game.competition.toUpperCase();
  }

  /**
   * Gibt die Liste der Celebration Types zurück
   *
   * TODO: Sollte mit manifest.celebrationTypes übereinstimmen
   */
  getCelebrationTypes(): CelebrationType[] {
    // TODO: Anpassen für deine Sportart
    // Beispiele für verschiedene Sportarten:
    // - NFL: ['touchdown', 'fieldgoal', 'interception', 'sack', 'fumble', 'safety']
    // - Fußball: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card']
    // Cast zu CelebrationType da das Template generisch ist
    return ['touchdown'] as CelebrationType[]; // Placeholder
  }

  // Helper Methods (optional)

  /**
   * Hilfsmethode: Transformiert Team-Daten aus der API
   */
  // private transformTeam(apiTeam: any) {
  //   return {
  //     id: apiTeam.id,
  //     name: apiTeam.name,
  //     abbreviation: apiTeam.abbreviation || apiTeam.name.substring(0, 3).toUpperCase(),
  //     displayName: apiTeam.displayName || apiTeam.name,
  //     shortDisplayName: apiTeam.shortName || apiTeam.name,
  //     logo: apiTeam.logo || '',
  //     color: apiTeam.color || '#000000',
  //     alternateColor: apiTeam.alternateColor || '#FFFFFF',
  //     score: apiTeam.score || 0,
  //   };
  // }

  /**
   * Hilfsmethode: Mapped API-Status auf GameStatus
   */
  // private mapGameStatus(apiStatus: string): GameStatus {
  //   switch (apiStatus.toLowerCase()) {
  //     case 'scheduled': return 'scheduled';
  //     case 'in_progress': return 'in_progress';
  //     case 'halftime': return 'halftime';
  //     case 'final': return 'final';
  //     default: return 'scheduled';
  //   }
  // }
}
