import React from 'react';

export default function CheckIcon({ className = '', title, style = {}, ...props }) {
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
      <path
        d="M4 13L9.5 18.5L20 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
