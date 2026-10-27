import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { apiFetch } from '../api';

interface LanguageSelectorProps {
  variant?: 'header' | 'inline' | 'minimal';
  className?: string;
  isLoggedIn?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
  isLoggedIn = false,
}) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  const handleLanguageChange = async (newLang: string) => {
    i18n.changeLanguage(newLang);
    try {
      localStorage.setItem('raithu_lang', newLang);
      if (isLoggedIn) {
        await apiFetch('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ preferredLanguage: newLang }),
        });
      }
    } catch (_) {}
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200 ${className}`}>
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => handleLanguageChange(l.code)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              i18n.language === l.code
                ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-200/70'
            }`}
          >
            {l.native}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <Globe className="w-4 h-4 text-emerald-800" aria-hidden="true" />
      <select
        value={i18n.language.startsWith('te') ? 'te' : i18n.language.startsWith('hi') ? 'hi' : 'en'}
        onChange={(e) => handleLanguageChange(e.target.value)}
        aria-label="Select Interface Language"
        className="bg-stone-50 border border-stone-300 text-stone-800 text-xs font-medium rounded-md px-2 py-1.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer hover:border-emerald-600 transition-colors"
      >
        <option value="en">English</option>
        <option value="te">తెలుగు (Telugu)</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </select>
    </div>
  );
};
