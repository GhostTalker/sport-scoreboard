import { useSettingsStore } from '../../stores/settingsStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n/translations';

export function LanguageSelector() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const { t } = useTranslation();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <section className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{t.settings.language.title}</h3>
      <p className="text-white/50 text-sm mb-4">
        {t.settings.language.subtitle}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleLanguageChange('de')}
          className={`
            flex-1 py-3 px-4 rounded-lg font-medium transition-all
            ${language === 'de'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-white/70 hover:bg-slate-600'}
          `}
        >
          {t.settings.language.german}
        </button>
        <button
          onClick={() => handleLanguageChange('en')}
          className={`
            flex-1 py-3 px-4 rounded-lg font-medium transition-all
            ${language === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-white/70 hover:bg-slate-600'}
          `}
        >
          {t.settings.language.english}
        </button>
      </div>
    </section>
  );
}
