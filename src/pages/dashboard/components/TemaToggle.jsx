import React from 'react';

export default function TemaToggle({ value, onChange, loading }) {
  const isLight = value === 'light';

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-normal uppercase transition-colors ${!isLight ? 'text-primary' : 'text-gray-600'}`}>DARK</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => onChange(isLight ? 'dark' : 'light')}
        aria-label="Alternar tema da vitrine"
        className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-all duration-300 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isLight ? 'bg-white border-gray-300' : 'bg-dark-200 border-gray-700'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full shadow-md transition-all duration-300 ${isLight ? 'translate-x-7 bg-gray-900' : 'translate-x-1 bg-primary'}`} />
      </button>
      <span className={`text-xs font-normal uppercase transition-colors ${isLight ? 'text-primary' : 'text-gray-600'}`}>WHITE</span>
    </div>
  );
}
