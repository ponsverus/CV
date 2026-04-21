import React from 'react';
import svg from '../../assets/icons/agendamentos.svg?raw';
import InlineSvgIcon from './InlineSvgIcon';

export default function AgendamentosIcon(props) {
  return <InlineSvgIcon svg={svg} {...props} />;
}
