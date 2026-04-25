import React from 'react';

export default function ZapIcon({
  className = '',
  title,
  style = {},
  ...props
}) {
  return (
    <svg
      viewBox="0 0 384 512"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <path d="M153.6 0L0 288h134.4L96 512l288-352H249.6L288 0H153.6z" />
    </svg>
  );
}
