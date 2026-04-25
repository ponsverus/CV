import React from 'react';

export default function CheckDoubleIcon({
  className = '',
  title,
  style = {},
  ...props
}) {
  return (
    <svg
      viewBox="0 0 576 512"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <path d="M573.7 77.1c7.6 7.6 7.6 20 0 27.6l-318 318c-7.6 7.6-20 7.6-27.6 0l-142-142c-7.6-7.6-7.6-20 0-27.6l27.6-27.6c7.6-7.6 20-7.6 27.6 0L242 338.7 518.5 62.3c7.6-7.6 20-7.6 27.6 0l27.6 27.6z" />

      <path d="M360.6 77.1c7.6 7.6 7.6 20 0 27.6L168.7 296.6c-7.6 7.6-20 7.6-27.6 0l-98-98c-7.6-7.6-7.6-20 0-27.6l27.6-27.6c7.6-7.6 20-7.6 27.6 0l56.8 56.8L333 49.5c7.6-7.6 20-7.6 27.6 0l27.6 27.6z" />
    </svg>
  );
}
