import { useSettingsStore } from '../stores/settingsStore';
import { translations, type Language, type Translations } from './translations';

/**
 * Hook to access translations based on current language
 */
export function useTranslation() {
  const language = useSettingsStore((state) => state.language);

  const t: Translations = translations[language];

  return { t, language };
}

/**
 * Get translation without hook (for non-React code)
 */
export function getTranslation(language: Language): Translations {
  return translations[language];
}
