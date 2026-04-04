import { ptBR } from '../../feedback/messages/ptBR.js';

export const STATUS_COLOR_CLASS = {
  ABERTO: 'bg-green-500',
  FECHADO: 'bg-red-500',
  ALMOCO: 'bg-yellow-400',
  INATIVO: 'bg-gray-600',
};

export const SUPORTE_PHONE_E164 = '5533999037979';
export const SUPORTE_MSG = 'Olá, sou cadastrado como Profissional e gostaria de uma ajuda especializada para o meu perfil. Pode me orientar?';
export const SUPORTE_HREF = `https://wa.me/${SUPORTE_PHONE_E164}?text=${encodeURIComponent(SUPORTE_MSG)}`;

export const AG_PAGE_SIZE = 15;
export const IMAGE_EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export const NOW_RPC_SEQUENCE = ['now_sp', 'now_sp_fallback'];

export const WEEKDAYS = [
  { value: 0, label: 'DOM' },
  { value: 1, label: 'SEG' },
  { value: 2, label: 'TER' },
  { value: 3, label: 'QUA' },
  { value: 4, label: 'QUI' },
  { value: 5, label: 'SEX' },
  { value: 6, label: 'SÁB' },
];

export const toNumberOrNull = (v) => {
  if (v === '' || v == null) return null;
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) ? n : null;
};

export const sameDay = (a, b) => String(a || '') === String(b || '');

export function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

export const getAgDate = (a) => String(a?.data ?? '');
export const getAgInicio = (a) => String(a?.horario_inicio ?? '').slice(0, 5);

export const normalizeStatus = (s) =>
  String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const isCancelStatus = (s) => normalizeStatus(s).includes('cancelado');
export const isDoneStatus = (s) => normalizeStatus(s) === 'concluido';
export const computeStatusFromDb = (a) => String(a?.status || '');

export function formatDateBRFromISO(dateStr) {
  if (!dateStr) return 'Selecionar';
  const [y, m, d] = String(dateStr).split('-');
  if (!y || !m || !d) return String(dateStr);
  return `${d}.${m}.${y}`;
}

export function getImageExt(file) {
  return IMAGE_EXT_BY_MIME[file?.type] || null;
}

export const toUpperClean = (s) => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();
export const isEnderecoPadrao = (s) => /^.+,\s*\d+.*\s-\s.+,\s.+$/.test(String(s || '').trim());

export function getValorEntrega(entrega) {
  const preco = Number(entrega?.preco ?? 0);
  const promoRaw = entrega?.preco_promocional;
  const promo = (promoRaw == null || promoRaw === '') ? null : Number(promoRaw);
  if (promo != null && Number.isFinite(promo) && promo > 0 && promo < preco) return promo;
  return preco;
}

export function getValorAgendamento(a) {
  const frozen = Number(a?.preco_final);
  if (Number.isFinite(frozen) && frozen > 0) return frozen;
  return getValorEntrega(a?.entregas);
}

export const normalizeKey = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const getBizLabel = (group, key) =>
  ptBR?.dashboard?.business?.[key]?.[group] ?? ptBR?.dashboard?.business?.[key]?.servicos ?? '';
