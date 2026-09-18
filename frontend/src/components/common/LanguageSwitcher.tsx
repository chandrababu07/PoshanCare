import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LOCALES, SupportedLocale } from '../../i18n';
import { patchUserProfile } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';

export interface LanguageSwitcherProps {
  variant?: 'compact' | 'expanded';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { i18n, t } = useTranslation('common');
  const { user } = useAuth();
  const currentLang = (i18n.language || 'en').slice(0, 2) as SupportedLocale;

  const handleLanguageChange = async (newLocale: SupportedLocale) => {
    if (newLocale === currentLang) return;
    await i18n.changeLanguage(newLocale);

    // If authenticated, persist to user profile in backend
    if (user) {
      try {
        await patchUserProfile({ preferred_language: newLocale });
      } catch (err) {
        console.warn('Failed to sync language preference to profile:', err);
      }
    }
  };

  if (variant === 'expanded') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {SUPPORTED_LOCALES.map((locale) => {
          const isSelected = currentLang === locale.code;
          return (
            <button
              key={locale.code}
              type="button"
              onClick={() => handleLanguageChange(locale.code)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              aria-pressed={isSelected}
              aria-label={`Switch language to ${locale.label}`}
            >
              <span>{locale.nativeName}</span>
              <span className="text-xs opacity-75">({locale.label})</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="language-select-header" className="sr-only">
        {t('search', 'Select language')}
      </label>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-xl bg-surface-container-lowest border border-surface-container-low text-on-surface hover:bg-surface-container-low transition-colors">
        <Globe className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <select
          id="language-select-header"
          value={currentLang}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLocale)}
          className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer pr-1"
          aria-label="Select application language"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <option key={loc.code} value={loc.code} className="bg-surface text-on-surface">
              {loc.nativeName} ({loc.label})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
