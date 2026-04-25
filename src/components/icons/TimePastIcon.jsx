import React from 'react';

export default function TimeQuarterToIcon({
  className = '',
  title,
  style = {},
  ...props
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <circle cx="256" cy="48" r="20" />
      <circle cx="464" cy="256" r="20" />
      <circle cx="256" cy="464" r="20" />
      <circle cx="48" cy="256" r="20" />

      <circle cx="256" cy="256" r="12" />

      <path d="M256 140v120l90 50" />
    </svg>
  );
}
