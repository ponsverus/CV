import React from 'react';

export default function TimeIcon({ className = '', title, style = {}, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="0.75"/>
      <line x1="12" y1="13" x2="12" y2="8.5" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round"/>
      <line x1="12" y1="13" x2="15.5" y2="13" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round"/>
    </svg>
  );
}
