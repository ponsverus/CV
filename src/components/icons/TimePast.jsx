import React from 'react';

export default function TimerHistoryIcon({ className = '', title, style = {}, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: 'inline-block', ...style }}
      {...props}
    >
      {title && <title>{title}</title>}

      <path
        d="M20 13a8 8 0 1 1-2.5-5.8"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />

      <path
        d="M17.5 5.5L20 7l-1.5 2.5"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <line x1="12" y1="13" x2="12" y2="9" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round"/>
      <line x1="12" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round"/>
    </svg>
  );
}
