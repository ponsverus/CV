import React from 'react';

export default function UserIcon({
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
      <circle 
        cx="512" 
        cy="256" 
        r="185" 
        fill="#1e2c4c" 
      />
      <ellipse 
        cx="512" 
        cy="712" 
        rx="292" 
        ry="170" 
        fill="#9499ad" 
      />
    </svg>
  );
}
