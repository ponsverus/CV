import React from 'react';
import usersSvg from '../../assets/icons/users.svg';

export default function UsersIcon({ className = '', title, style = {}, ...props }) {
  return (
    <span
      className={className}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      title={title}
      style={{
        display: 'inline-block',
        backgroundColor: 'currentColor',
        maskImage: `url(${usersSvg})`,
        WebkitMaskImage: `url(${usersSvg})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        ...style,
      }}
      {...props}
    />
  );
}
