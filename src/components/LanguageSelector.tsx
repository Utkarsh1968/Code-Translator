// import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  languages: Language[];
  selected: string;
  onChange: (value: string) => void;
  label: string;
}

export function LanguageSelector({ languages, selected, onChange, label }: LanguageSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">{label}:</label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="block w-40 rounded-md border-gray-300 shadow-sm bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.icon} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}