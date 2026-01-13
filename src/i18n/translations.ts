/**
 * Translation dictionary for the application
 * Supports German (de) and English (en)
 */

export type Language = 'de' | 'en';

export interface Translations {
  // Settings Panel
  settings: {
    title: string;
    subtitle: string;
    viewMode: {
      title: string;
      singleView: string;
      singleViewDesc: string;
      multiView: string;
      multiViewDesc: string;
    };
    multiViewFilters: {
      live: string;
      upcoming: string;
      final: string;
    };
    gameSelection: {
      title: string;
      subtitle: string;
    };
    sound: {
      title: string;
      soundEffects: string;
      soundEffectsDesc: string;
    };
    celebration: {
      title: string;
      subtitle: string;
      enable: string;
      disable: string;
    };
    competition: {
      title: string;
      subtitle: string;
    };
    language: {
      title: string;
      subtitle: string;
      german: string;
      english: string;
    };
    debug: {
      title: string;
    };
    navigation: {
      hint: string;
    };
  };

  // Sidebar
  sidebar: {
    plugins: string;
    debug: string;
  };

  // Plugin Manager
  pluginManager: {
    title: string;
    available: string;
    enabled: string;
    disabled: string;
  };

  // Scoreboard
  scoreboard: {
    live: string;
    final: string;
    scheduled: string;
    postponed: string;
    loading: string;
    noGames: string;
  };

  // Game Status
  gameStatus: {
    down: string;
    goal: string;
    and: string;
    quarter: string;
    halftime: string;
    overtime: string;
    final: string;
  };

  // Stats
  stats: {
    passing: string;
    rushing: string;
    receiving: string;
    totalYards: string;
    completions: string;
    attempts: string;
    yards: string;
    touchdowns: string;
    interceptions: string;
    carries: string;
    receptions: string;
    targets: string;
  };

  // Competition Names
  competitions: {
    nfl: string;
    bundesliga: string;
    'dfb-pokal': string;
  };
}

export const translations: Record<Language, Translations> = {
  de: {
    settings: {
      title: 'Einstellungen',
      subtitle: 'Konfiguriere dein Scoreboard',
      viewMode: {
        title: 'Anzeigemodus',
        singleView: 'Einzelansicht',
        singleViewDesc: 'Ein Spiel detailliert anzeigen',
        multiView: 'Mehrfachansicht',
        multiViewDesc: 'Übersicht aller Spiele',
      },
      multiViewFilters: {
        live: 'Live',
        upcoming: 'Anstehend',
        final: 'Beendet',
      },
      gameSelection: {
        title: 'Spiel auswählen',
        subtitle: 'Wähle das Spiel aus, das auf dem Scoreboard angezeigt werden soll',
      },
      sound: {
        title: 'Sound',
        soundEffects: 'Soundeffekte',
        soundEffectsDesc: 'Spiele Sounds bei Touchdowns und Field Goals ab',
      },
      celebration: {
        title: 'Celebration Videos',
        subtitle: 'Aktiviere oder deaktiviere Videos für bestimmte Ereignisse',
        enable: 'Aktivieren',
        disable: 'Deaktivieren',
      },
      competition: {
        title: 'Wettbewerb',
        subtitle: 'Wähle den Wettbewerb',
      },
      language: {
        title: 'Sprache',
        subtitle: 'Wähle deine bevorzugte Sprache',
        german: 'Deutsch',
        english: 'English',
      },
      debug: {
        title: 'Debug-Steuerung',
      },
      navigation: {
        hint: 'Drücke Pfeil rechts oder Escape zum Zurückkehren',
      },
    },
    sidebar: {
      plugins: 'Plugins',
      debug: 'Debug',
    },
    pluginManager: {
      title: 'Plugin-Verwaltung',
      available: 'Verfügbare Plugins',
      enabled: 'Aktiviert',
      disabled: 'Deaktiviert',
    },
    scoreboard: {
      live: 'LIVE',
      final: 'BEENDET',
      scheduled: 'ANGESETZT',
      postponed: 'VERSCHOBEN',
      loading: 'Lädt...',
      noGames: 'Keine Spiele verfügbar',
    },
    gameStatus: {
      down: 'Down',
      goal: 'Goal',
      and: 'und',
      quarter: 'Viertel',
      halftime: 'Halbzeit',
      overtime: 'Verlängerung',
      final: 'Beendet',
    },
    stats: {
      passing: 'Pässe',
      rushing: 'Läufe',
      receiving: 'Gefangen',
      totalYards: 'Gesamt Yards',
      completions: 'Vervollständigungen',
      attempts: 'Versuche',
      yards: 'Yards',
      touchdowns: 'Touchdowns',
      interceptions: 'Interceptions',
      carries: 'Läufe',
      receptions: 'Gefangen',
      targets: 'Ziele',
    },
    competitions: {
      nfl: 'NFL',
      bundesliga: 'Bundesliga',
      'dfb-pokal': 'DFB-Pokal',
    },
  },
  en: {
    settings: {
      title: 'Settings',
      subtitle: 'Configure your scoreboard',
      viewMode: {
        title: 'View Mode',
        singleView: 'SingleView',
        singleViewDesc: 'Show one game detailed',
        multiView: 'MultiView',
        multiViewDesc: 'Overview of all games',
      },
      multiViewFilters: {
        live: 'Live',
        upcoming: 'Upcoming',
        final: 'Final',
      },
      gameSelection: {
        title: 'Select Game',
        subtitle: 'Choose which game to display on the scoreboard',
      },
      sound: {
        title: 'Sound',
        soundEffects: 'Sound Effects',
        soundEffectsDesc: 'Play sounds on touchdowns and field goals',
      },
      celebration: {
        title: 'Celebration Videos',
        subtitle: 'Enable or disable videos for specific events',
        enable: 'Enable',
        disable: 'Disable',
      },
      competition: {
        title: 'Competition',
        subtitle: 'Choose the competition',
      },
      language: {
        title: 'Language',
        subtitle: 'Select your preferred language',
        german: 'Deutsch',
        english: 'English',
      },
      debug: {
        title: 'Debug Controls',
      },
      navigation: {
        hint: 'Press Arrow Right or Escape to return',
      },
    },
    sidebar: {
      plugins: 'Plugins',
      debug: 'Debug',
    },
    pluginManager: {
      title: 'Plugin Management',
      available: 'Available Plugins',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    scoreboard: {
      live: 'LIVE',
      final: 'FINAL',
      scheduled: 'SCHEDULED',
      postponed: 'POSTPONED',
      loading: 'Loading...',
      noGames: 'No games available',
    },
    gameStatus: {
      down: 'Down',
      goal: 'Goal',
      and: 'and',
      quarter: 'Quarter',
      halftime: 'Halftime',
      overtime: 'Overtime',
      final: 'Final',
    },
    stats: {
      passing: 'Passing',
      rushing: 'Rushing',
      receiving: 'Receiving',
      totalYards: 'Total Yards',
      completions: 'Completions',
      attempts: 'Attempts',
      yards: 'Yards',
      touchdowns: 'Touchdowns',
      interceptions: 'Interceptions',
      carries: 'Carries',
      receptions: 'Receptions',
      targets: 'Targets',
    },
    competitions: {
      nfl: 'NFL',
      bundesliga: 'Bundesliga',
      'dfb-pokal': 'DFB Cup',
    },
  },
};

/**
 * Get browser's preferred language
 */
export function getBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('de')) {
    return 'de';
  }
  return 'en'; // Default to English
}
