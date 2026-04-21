import React from 'react';
import svg from '../../assets/icons/users.svg?raw';
import InlineSvgIcon from './InlineSvgIcon';

export default function UsersIcon(props) {
  return <InlineSvgIcon svg={svg} {...props} />;
}
