function _norm(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const TIPO_PARA_GRUPO = {
  'barbearia':      'servicos',
  's. de beleza':   'servicos',
  'cabeleireiro':   'servicos',
  'm. e pedicure':  'servicos',
  'e. tatuagem':    'servicos',
  'estetica':       'servicos',
  'spa':            'servicos',
  'c. medica':      'servicos',
  'dentista':       'servicos',
  'nutricao':       'servicos',
  'c. veterinaria': 'servicos',
  'fisioterapia':   'servicos',
  'fonoaudiologia': 'servicos',
  'terapia':        'servicos',
  'dermatologia':   'servicos',

  'psicologia':     'consultas',

  'p. trainer':     'aulas',
  'academia':       'aulas',
  'pilates':        'aulas',
  'yoga':           'aulas',
  'danca':          'aulas',
  'musica':         'aulas',
  'idiomas':        'aulas',
  'natacao':        'aulas',
  'crossfit':       'aulas',
  'ginastica':      'aulas',
};

export function getBusinessGroup(tipoNegocio) {
  const key = _norm(tipoNegocio);
  if (!key) return 'servicos';
  if (TIPO_PARA_GRUPO[key]) return TIPO_PARA_GRUPO[key];
  const match = Object.keys(TIPO_PARA_GRUPO).find(
    k => key.includes(k) || k.includes(key)
  );
  return match ? TIPO_PARA_GRUPO[match] : 'servicos';
}
