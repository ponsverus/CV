import React from 'react';
export default function UsersIcon({ className = '', title, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="9" cy="8" r="3" fill="currentColor" />
      <path
        d="M3.75 18a5.25 5.25 0 0 1 10.5 0v.25H3.75V18Z"
        fill="currentColor"
      />
      <circle cx="16.5" cy="9.25" r="2.5" fill="currentColor" opacity="0.8" />
      <path
        d="M13.75 18c0-2.347 1.903-4.25 4.25-4.25S22.25 15.653 22.25 18v.25h-8.5V18Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}
