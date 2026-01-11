
import React from 'react';
import { SUPPORTED_LANGUAGES } from '../types.ts';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-indigo-300/80 px-1">Target Language</label>
      <div className="relative">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.name} className="bg-slate-900 text-white">
              {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
          <i className="fa-solid fa-chevron-down text-xs"></i>
        </div>
      </div>
    </div>
  );
};
