import React from 'react';

export default function DoubleCheckIcon({
  className = '',
  title,
  style = {},
  size = 24,
  ...props
}) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="none"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      {...props}
    >
      {title && <title>{title}</title>}

      <path
        d="M 60 480 L 320 740 L 780 280"
        stroke="currentColor"
        strokeWidth="110"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <path
        d="M 280 480 L 540 740 L 1000 280"
        stroke="currentColor"
        strokeWidth="110"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
