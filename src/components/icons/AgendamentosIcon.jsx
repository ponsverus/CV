import React from 'react';

  export default function AgendamentosIcon({
    className = '',
    title,
    style = {},
    dotFill = 'white',
    dotOpacity = 0.7,
    ...props
  }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={{ display: 'inline-block', ...style }}
        aria-hidden={title ? undefined : 'true'}
        role={title ? 'img' : 'presentation'}
        {...props}
      >
        {title && <title>{title}</title>}
        <rect x="2" y="3.5" width="20" height="5" rx="2.5" />
        <circle cx="6.5" cy="6" r="1.5" fill={dotFill} opacity={dotOpacity} />
        <rect x="2" y="9.5" width="20" height="5" rx="2.5" />
        <circle cx="6.5" cy="12" r="1.5" fill={dotFill} opacity={dotOpacity} />
        <rect x="2" y="15.5" width="20" height="5" rx="2.5" />
        <circle cx="6.5" cy="18" r="1.5" fill={dotFill} opacity={dotOpacity} />
      </svg>
    );
  }
