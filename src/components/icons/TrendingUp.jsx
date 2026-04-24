import React from 'react';

export default function TrendingUpIcon({ className = '', title, style = {}, ...props }) {
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
        d="M4 14l5-5 4 4 6-6"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 7h3v3"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
