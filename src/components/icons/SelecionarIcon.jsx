 import React from 'react';

  export default function SelecionarIcon({ className = '', title, style = {}, ...props }) {
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
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.5" />
      </svg>
    );
  }
