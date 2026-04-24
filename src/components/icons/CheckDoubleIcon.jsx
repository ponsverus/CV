import React from 'react';

export default function CheckDoubleIcon({ className = '', title, style = {}, ...props }) {
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
        d="M4 12l4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 12l4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
