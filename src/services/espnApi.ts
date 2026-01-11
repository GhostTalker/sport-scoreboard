import { API_ENDPOINTS } from '../constants/api';
import type { Game, GameStatus } from '../types/game';
import type { GameStats, TeamStats, PlayerStats } from '../types/stats';
import { getTeamById } from '../constants/teams';

// Fetch scoreboard data (all games for current week + upcoming weeks)
export async function fetchScoreboard(): Promise<Game[]> {
  try {
    const response = await fetch(API_ENDPOINTS.scoreboard);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    let games = parseScoreboardResponse(data);
    
    // Check if we have upcoming games - if not, try to fetch next week(s)
    const hasUpcoming = games.some(g => g.status === 'scheduled');
    const hasLive = games.some(g => g.status === 'in_progress' || g.status === 'halftime');
    
    if (!hasUpcoming && !hasLive) {
      // Get current season info
      const seasonType = data.season?.type || data.leagues?.[0]?.season?.type || 2;
      const currentWeek = data.week?.number || 1;
      const year = data.season?.year || new Date().getFullYear();
      
      
      // For playoffs (seasonType 3), try to fetch upcoming rounds
      if (seasonType === 3) {
        // Try fetching next few playoff weeks
        for (let week = currentWeek + 1; week <= 5; week++) {
          try {
            const futureGames = await fetchScheduleWeek(year, 3, week);
            if (futureGames.length > 0) {
              games = [...games, ...futureGames];
            }
          } catch {
            // Silently ignore - playoff week may not exist yet
          }
        }
      }
      
      // If regular season week 18 and all games final, fetch playoff week 1 (Wild Card)
      if (seasonType === 2 && currentWeek >= 18) {
        try {
          const playoffGames = await fetchScheduleWeek(year, 3, 1);
          if (playoffGames.length > 0) {
            games = [...games, ...playoffGames];
          }
        } catch {
          // Silently ignore - Wild Card games may not be scheduled yet
        }
      }
    }
    
    return games;
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    throw error;
  }
}

// Fetch games for a specific week
async function fetchScheduleWeek(year: number, seasonType: number, week: number): Promise<Game[]> {
  try {
    const url = `${API_ENDPOINTS.schedule}?year=${year}&seasonType=${seasonType}&week=${week}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return parseScoreboardResponse(data);
  } catch {
    return [];
  }
}

// Fetch single game with detailed stats
export async function fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats } | null> {
  try {
    const response = await fetch(API_ENDPOINTS.game(gameId));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return parseGameDetailsResponse(data);
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
}

// Parse ESPN scoreboard response
function parseScoreboardResponse(data: any): Game[] {
  if (!data?.events) return [];
  
  // Get season info from the top level
  const seasonType = data.season?.type || data.leagues?.[0]?.season?.type || 2;
  const week = data.week?.number || data.leagues?.[0]?.calendarType === 'list' 
    ? data.leagues?.[0]?.calendar?.findIndex((c: any) => c.value === data.week?.value) + 1 
    : 1;
  
  return data.events.map((event: any) => {
    const competition = event.competitions?.[0];
    if (!competition) return null;

    const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home');
    const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return null;

    // Use event-specific week if available, fallback to top-level week
    const eventWeek = event.week?.number || week;
    const eventSeasonType = event.season?.type || seasonType;
    
    const status = parseGameStatus(event.status);
    const seasonName = getSeasonName(eventSeasonType, eventWeek, event.season?.slug);
    
    
    return {
      id: event.id,
      status,
      homeTeam: parseTeam(homeCompetitor),
      awayTeam: parseTeam(awayCompetitor),
      clock: {
        displayValue: event.status?.displayClock || '0:00',
        period: event.status?.period || 0,
        periodName: getPeriodName(event.status?.period || 0),
      },
      situation: parseSituation(competition.situation),
      venue: competition.venue?.fullName,
      broadcast: competition.broadcasts?.[0]?.names?.[0],
      startTime: event.date,
      seasonType: eventSeasonType,
      week: eventWeek,
      seasonName,
    } as Game;
  }).filter(Boolean);
}

// Get display name for season/round
function getSeasonName(seasonType: number, week: number, slug?: string): string {
  // Check if slug contains specific round info
  if (slug) {
    const slugLower = slug.toLowerCase();
    if (slugLower.includes('super-bowl')) return 'SUPER BOWL';
    if (slugLower.includes('conference')) return 'CONFERENCE CHAMPIONSHIP';
    if (slugLower.includes('divisional')) return 'DIVISIONAL ROUND';
    if (slugLower.includes('wild-card')) return 'WILD CARD';
  }
  
  // Preseason
  if (seasonType === 1) return 'PRESEASON';
  
  // Regular season
  if (seasonType === 2) return 'GAME DAY';
  
  // Postseason - determine round by week
  if (seasonType === 3) {
    switch (week) {
      case 1: return 'WILD CARD';
      case 2: return 'DIVISIONAL ROUND';
      case 3: return 'CONFERENCE CHAMPIONSHIP';
      case 4: return 'PRO BOWL';
      case 5: return 'SUPER BOWL';
      default: return 'PLAYOFFS';
    }
  }
  
  return 'GAME DAY';
}

function parseTeam(competitor: any) {
  const team = competitor.team;
  const teamData = getTeamById(team.id);
  
  return {
    id: team.id,
    name: team.name || teamData?.name || 'Unknown',
    abbreviation: team.abbreviation || teamData?.abbreviation || '???',
    displayName: team.displayName || teamData?.displayName || 'Unknown Team',
    shortDisplayName: team.shortDisplayName || teamData?.shortDisplayName || 'Unknown',
    logo: team.logo || teamData?.logo || '',
    color: teamData?.color || team.color || '333333',
    alternateColor: teamData?.alternateColor || team.alternateColor || '666666',
    score: parseInt(competitor.score || '0', 10),
  };
}

function parseGameStatus(status: any): GameStatus {
  const state = status?.type?.state;
  const description = status?.type?.description?.toLowerCase() || '';
  
  if (state === 'pre') return 'scheduled';
  if (state === 'post') return 'final';
  if (description.includes('halftime')) return 'halftime';
  if (description.includes('end')) return 'end_period';
  if (description.includes('delayed')) return 'delayed';
  if (description.includes('postponed')) return 'postponed';
  if (state === 'in') return 'in_progress';
  
  return 'scheduled';
}

function getPeriodName(period: number): string {
  switch (period) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    case 4: return '4th';
    case 5: return 'OT';
    default: return period > 5 ? `OT${period - 4}` : '';
  }
}

function parseSituation(situation: any) {
  if (!situation) return undefined;

  const possessionId = situation.possession;
  const lastPlayType = situation.lastPlay?.type?.text || '';

  return {
    down: situation.down || 0,
    distance: situation.distance || 0,
    yardLine: situation.yardLine || 0,
    possession: possessionId || '',
    possessionText: situation.possessionText || '', // "PHI 35", "SF 20"
    isRedZone: situation.isRedZone || false,
    shortDownDistanceText: situation.shortDownDistanceText || situation.downDistanceText || '',
    lastPlayType: lastPlayType,
  };
}

// Parse detailed game response
function parseGameDetailsResponse(data: any): { game: Game; stats: GameStats } | null {
  if (!data) return null;
  
  // Parse basic game info from header/boxscore
  const boxscore = data.boxscore;
  const header = data.header;
  
  if (!boxscore || !header) return null;

  const competition = header.competitions?.[0];
  const homeCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  const game: Game = {
    id: header.id,
    status: parseGameStatus(header.status),
    homeTeam: parseTeam(homeCompetitor),
    awayTeam: parseTeam(awayCompetitor),
    clock: {
      displayValue: header.status?.displayClock || '0:00',
      period: header.status?.period || 0,
      periodName: getPeriodName(header.status?.period || 0),
    },
    situation: parseSituation(data.situation),
    venue: competition?.venue?.fullName,
  };

  const stats = parseGameStats(boxscore, homeCompetitor.team.id, awayCompetitor.team.id);

  return { game, stats };
}

function parseGameStats(boxscore: any, homeTeamId: string, awayTeamId: string): GameStats {
  const players = boxscore?.players || [];
  
  const homePlayerStats = players.find((p: any) => p.team?.id === homeTeamId);
  const awayPlayerStats = players.find((p: any) => p.team?.id === awayTeamId);

  return {
    homeStats: parseTeamStats(homePlayerStats, boxscore?.teams?.[0], homeTeamId),
    awayStats: parseTeamStats(awayPlayerStats, boxscore?.teams?.[1], awayTeamId),
  };
}

function parseTeamStats(playerStats: any, teamStats: any, teamId: string): TeamStats {
  const stats = teamStats?.statistics || [];
  
  // Find specific stats
  const findStat = (name: string) => {
    const stat = stats.find((s: any) => s.name?.toLowerCase() === name.toLowerCase());
    return stat?.displayValue || '0';
  };

  // Get leader stats
  const getLeader = (category: string): PlayerStats | null => {
    const categoryStats = playerStats?.statistics?.find(
      (s: any) => s.name?.toLowerCase() === category.toLowerCase()
    );
    const leader = categoryStats?.leaders?.[0];
    if (!leader) return null;
    
    return {
      name: leader.athlete?.shortName || leader.athlete?.displayName || 'Unknown',
      stats: leader.displayValue || '',
    };
  };

  const thirdDown = findStat('thirdDownEff');
  const redZone = findStat('redZoneEff');

  return {
    teamId,
    passing: getLeader('passing'),
    rushing: getLeader('rushing'),
    receiving: getLeader('receiving'),
    totalYards: parseInt(findStat('totalYards') || '0', 10),
    turnovers: parseInt(findStat('turnovers') || '0', 10),
    timeOfPossession: findStat('possessionTime'),
    thirdDownEfficiency: thirdDown,
    thirdDownPercentage: parseEfficiencyPercentage(thirdDown),
    redZoneEfficiency: redZone,
    redZonePercentage: parseEfficiencyPercentage(redZone),
    sacks: parseInt(findStat('sacks') || '0', 10),
    penalties: parseInt(findStat('penalties') || '0', 10),
    penaltyYards: parseInt(findStat('penaltyYards') || '0', 10),
  };
}

function parseEfficiencyPercentage(efficiency: string): number {
  // Parse "3-5" or "3/5" format
  const match = efficiency.match(/(\d+)[-/](\d+)/);
  if (!match) return 0;
  
  const [, made, attempts] = match;
  const attemptsNum = parseInt(attempts, 10);
  if (attemptsNum === 0) return 0;
  
  return Math.round((parseInt(made, 10) / attemptsNum) * 100);
}
