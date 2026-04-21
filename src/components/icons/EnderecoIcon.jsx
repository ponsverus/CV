import React from 'react';

  export default function EnderecoIcon({ className = '', title, style = {}, ...props }) {
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
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 13 6 13s6-8.5 6-13c0-3.314-2.686-6-6-6Z"
        />
        <circle cx="12" cy="8" r="2.2" fill="white" opacity="0.85" />
      </svg>
    );
  }
