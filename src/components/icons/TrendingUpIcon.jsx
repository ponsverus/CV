import React from 'react';

export default function TrendingUpIcon({
  className = '',
  title,
  style = {},
  ...props
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <path d="M16 2h-4l1.29 1.29-4.29 4.3-3-3-6 6v2.82l6-6 3 3 5.71-5.7 1.28 1.29 0.010-4z" />
    </svg>
  );
}
