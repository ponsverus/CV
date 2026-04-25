import React from 'react';

export default function DoubleCheckIcon({
  className = '',
  title,
  style = {},
  size = 24, // Default to 24x24
  ...props
}) {
  return (
    <svg
      viewBox="0 0 1024 1024" // Defined based on the image proportions
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
      // Accessibility: define a clear role or presentational
      role={title ? 'img' : 'presentation'}
      // Accessibility: hide from screen readers if no title is present
      aria-hidden={!title}
      {...props}
    >
      {title && <title>{title}</title>}

      <path
        // Precise geometric path for the left checkmark
        d="M 50 512 L 250 712 L 750 212"
        stroke="currentColor"
        strokeWidth="60" // Thick line width from the original
        strokeLinecap="round" // Rounded edges
        strokeLinejoin="round" // Smooth corners
      />
      <path
        d="M 270 512 L 470 712 L 970 212"
        stroke="currentColor"
        strokeWidth="60"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
