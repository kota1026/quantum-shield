import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLanguage } from '../i18n';

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'EN',
  ja: 'JA',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center space-x-1" data-testid="language-switcher">
      {supportedLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => handleLanguageChange(lang)}
          data-testid={`lang-${lang}`}
          className={`px-2 py-1 text-sm rounded transition-colors ${
            currentLanguage === lang || (currentLanguage.startsWith(lang) && currentLanguage !== lang)
              ? 'bg-qs-primary text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {languageLabels[lang]}
        </button>
      ))}
    </div>
  );
}
