import React from 'react';

  export default function NegocioVerificadoIcon({ className = '', title, style = {}, ...props }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={className}
        style={{ display: 'inline-block', ...style }}
        aria-hidden={title ? undefined : 'true'}
        role={title ? 'img' : 'presentation'}
        {...props}
      >
        {title && <title>{title}</title>}

        <path
          fill="#0095F6"
          d="M12 2.4c1.05 0 1.82.88 2.66 1.18.87.31 2.03.12 2.73.64.72.54.94 1.68 1.48 2.4.55.74 1.58 1.28 1.89 2.16.31.86-.22 1.95-.22 2.88s.53 2.02.22 2.88c-.31.88-1.34 1.42-1.89
  2.16-.54.72-.76 1.86-1.48 2.4-.7.52-1.86.33-2.73.64-.84.3-1.61 1.18-2.66 1.18s-1.82-.88-2.66-1.18c-.87-.31-2.03-.12-2.73-.64-.72-.54-.94-1.68-1.48-2.4-.55-.74-1.58-1.28-1.89-2.16-.31-.86.22-
  1.95.22-2.88s-.53-2.02-.22-2.88c.31-.88 1.34-1.42 1.89-2.16.54-.72.76-1.86 1.48-2.4.7-.52 1.86-.33 2.73-.64.84-.3 1.61-1.18 2.66-1.18Z"
        />

        <path
          d="M8.35 12.15 10.85 14.55 15.8 9.7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
