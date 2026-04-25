import React from 'react';

export default function CheckDoubleIcon({
  className = '',
  title,
  style = {},
  ...props
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', ...style }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <path d="M504.502 75.496c9.997 9.997 9.997 26.206 0 36.204L207.699 408.502c-9.997 9.997-26.206 9.997-36.204 0L7.498 244.505c-9.997-9.997-9.997-26.206 0-36.204s26.206-9.997 36.204 0L189.597 354.196 468.298 75.496c9.997-9.997 26.206-9.997 36.204 0z" />

      <path d="M504.502 235.496c9.997 9.997 9.997 26.206 0 36.204L287.699 488.502c-9.997 9.997-26.206 9.997-36.204 0L151.498 388.505c-9.997-9.997-9.997-26.206 0-36.204s26.206-9.997 36.204 0L269.597 434.196 468.298 235.496c9.997-9.997 26.206-9.997 36.204 0z" />
    </svg>
  );
}
