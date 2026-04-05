import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  X,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '../supabase';
import { ptBR } from '../feedback/messages/ptBR';
import { getBusinessGroup } from '../businessTerms';
import BookingCalendar from '../components/BookingCalendar';
import negocioVerificadoIcon from '../assets/icons/negocio-verificado.svg';

const SERVICOS_POR_PAGINA = 4;
const DEPOIMENTOS_POR_PAGINA = 10;
const NOW_RPC_SEQUENCE = ['now_sp', 'now_sp_fallback'];

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

function formatDateBR(ymd) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-');
  if (!y || !m || !d) return String(ymd);
  return `${d}.${m}.${y}`;
}

function getDowFromDateSP(dateStr) {
  if (!dateStr) return null;
  const dt = new Date(`${dateStr}T12:00:00`);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short',
  }).format(dt);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? null;
}

const withTimeout = (promise, ms, label = 'timeout') => {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`Timeout (${label}) em ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
};

function getPublicUrl(bucket, path) {
  if (!path) return null;
  try {
    const stripped = path.replace(new RegExp(`^${bucket}/`), '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(stripped);
    return data?.publicUrl || null;
  } catch { return null; }
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseSaoPauloDateTime(dateISO, timeValue) {
  const normalizedTime = String(timeValue || '00:00').slice(0, 5);
  return new Date(`${dateISO}T${normalizedTime}:00-03:00`);
}

function formatUtcCalendarDate(date) {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`;
}

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function slugifyFilePart(value) {
  return String(value || 'evento')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'evento';
}

function getCalendarPlatformMode() {
  if (typeof navigator === 'undefined') return 'chooser';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isAndroid = /Android/i.test(ua);
  const isIPhone = /iPhone/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  const isMac = /Mac/i.test(platform) && maxTouchPoints <= 1;

  if (isAndroid) return 'google-with-fallback';
  if (isIPhone || isIPad || isMac) return 'ics';
  return 'ics';
}

function gerarLinkGoogle({ titulo, dataISO, inicioHHMM, duracaoMin, detalhes, local }) {
  const inicio = parseSaoPauloDateTime(dataISO, inicioHHMM);
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);
  const details = [detalhes, local ? `Local: ${local}` : ''].filter(Boolean).join('\n');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${formatUtcCalendarDate(inicio)}/${formatUtcCalendarDate(fim)}&ctz=America%2FSao_Paulo&details=${encodeURIComponent(details)}&location=${encodeURIComponent(local || '')}&sf=true&output=xml`;
}

function gerarArquivoICS({ titulo, dataISO, inicioHHMM, duracaoMin, detalhes, local, uidSeed }) {
  const inicio = parseSaoPauloDateTime(dataISO, inicioHHMM);
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);
  const dtStamp = formatUtcCalendarDate(new Date());
  const dtStart = formatUtcCalendarDate(inicio);
  const dtEnd = formatUtcCalendarDate(fim);
  const uid = `${slugifyFilePart(uidSeed || titulo)}-${dtStart}@comvaga`;
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Comvaga//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(titulo)}`,
    `DESCRIPTION:${escapeIcsText(detalhes)}`,
    `LOCATION:${escapeIcsText(local)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete de agendamento',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return {
    content,
    filename: `${slugifyFilePart(titulo)}-${String(dataISO || '').replace(/-/g, '')}.ics`,
  };
}

function FacebookIcon({ className = '', size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className = '', size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16.5 7.5h.01" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function HeartIcon({ filled = false, className = '', size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function StarChar({ size = 18, className = '' }) {
  return <span className={className || 'text-primary'} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">★</span>;
}

function Stars5Char({ value = 0, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${v} de 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, lineHeight: 1 }} className={i <= v ? 'text-primary' : 'text-gray-300'} aria-hidden="true">★</span>
      ))}
    </div>
  );
}

function normalizeDiasTrabalho(arr) {
  const base = Array.isArray(arr) ? arr : [];
  const cleaned = base.map(n => Number(n)).filter(n => Number.isFinite(n)).map(n => (n === 7 ? 0 : n)).filter(n => n >= 0 && n <= 6);
  return Array.from(new Set(cleaned)).sort((a, b) => a - b);
}

function resolveInstagram(instaRaw) {
  const raw = String(instaRaw || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const handle = raw.replace(/^@/, '').replace(/\s+/g, '');
  return handle ? `https://instagram.com/${handle}` : null;
}

function resolveFacebook(fbRaw) {
  const raw = String(fbRaw || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const handle = raw.replace(/^@/, '').replace(/\s+/g, '');
  return handle ? `https://facebook.com/${handle}` : null;
}

function getPrecoFinalServico(s) {
  const preco = Number(s?.preco ?? 0);
  const promo = Number(s?.preco_promocional ?? 0);
  const temPromo = Number.isFinite(promo) && promo > 0 && promo < preco;
  return temPromo ? promo : preco;
}

function sanitizeTel(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  return v.replace(/[^\d+]/g, '');
}

function AlertModal({ open, onClose, title, body, buttonText, isLight }) {
  if (!open) return null;
  const bg      = isLight ? 'bg-vcard border-vborder'  : 'bg-dark-100 border-gray-800';
  const titleCl = isLight ? 'text-vtext'               : 'text-white';
  const bodyCl  = isLight ? 'text-vsub'                : 'text-gray-300';
  const closeCl = isLight ? 'text-vmuted hover:text-vtext' : 'text-gray-400 hover:text-white';
  const btnCl   = isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className={`border rounded-custom max-w-md w-full p-6 ${bg}`}>
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className={`text-xl font-normal ${titleCl}`}>{title}</h3>
          <button onClick={onClose} className={closeCl}><X className="w-6 h-6" /></button>
        </div>
        {body && <p className={`font-normal whitespace-pre-line ${bodyCl}`}>{body}</p>}
        <button onClick={onClose} className={`mt-5 w-full py-3 rounded-button uppercase font-normal transition-colors ${btnCl}`}>
          {buttonText || 'OK'}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ open, onCancel, onConfirm, title, body, confirmText, cancelText, isLight }) {
  if (!open) return null;
  const bg       = isLight ? 'bg-vcard border-vborder'  : 'bg-dark-100 border-gray-800';
  const titleCl  = isLight ? 'text-vtext'               : 'text-white';
  const bodyCl   = isLight ? 'text-vsub'                : 'text-gray-300';
  const closeCl  = isLight ? 'text-vmuted hover:text-vtext' : 'text-gray-400 hover:text-white';
  const cancelCl = isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-200';
  const confirmCl= isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className={`border rounded-custom max-w-md w-full p-6 ${bg}`}>
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className={`text-xl font-normal ${titleCl}`}>{title}</h3>
          <button onClick={onCancel} className={closeCl}><X className="w-6 h-6" /></button>
        </div>
        {body && <p className={`font-normal whitespace-pre-line ${bodyCl}`}>{body}</p>}
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel}  className={`flex-1 py-3 border rounded-button uppercase font-normal transition-colors ${cancelCl}`}>{cancelText || 'CANCELAR'}</button>
          <button onClick={onConfirm} className={`flex-1 py-3 rounded-button uppercase font-normal transition-colors ${confirmCl}`}>{confirmText || 'CONFIRMAR'}</button>
        </div>
      </div>
    </div>
  );
}

function SelectionBar({ itens, counterSingular, counterPlural, onConfirm, onClear, isLight }) {
  const qtd = itens.length;
  if (qtd === 0) return null;
  const durTotal = itens.reduce((s, x) => s + Number(x.duracao_minutos || 0), 0);
  const valTotal = itens.reduce((s, x) => s + getPrecoFinalServico(x), 0);
  const label    = qtd === 1 ? counterSingular : counterPlural;
  const bg       = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(10,10,10,0.97)';
  const border   = isLight ? 'rgba(214,203,182,0.9)'  : 'rgba(212,160,23,0.25)';
  const textMain = isLight ? 'text-vtext'             : 'text-white';
  const textSub  = isLight ? 'text-vsub'              : 'text-gray-500';
  const clearBtn = isLight ? 'text-vmuted hover:text-vtext' : 'text-gray-600 hover:text-gray-400';
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60]" style={{ background: bg, borderTop: `1px solid ${border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-vprimary flex items-center justify-center text-vprimary-text text-xs font-normal shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{qtd}</div>
          <div className="min-w-0">
            <div className={`text-sm font-normal truncate ${textMain}`}>{qtd} {label} selecionado{qtd > 1 ? 's' : ''}</div>
            <div className={`text-xs font-normal ${textSub}`}>{durTotal} min • R$ {valTotal.toFixed(2)}</div>
          </div>
          <button onClick={onClear} className={`shrink-0 ml-1 ${clearBtn}`} title="Limpar seleção"><X className="w-4 h-4" /></button>
        </div>
        <button onClick={onConfirm} className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-vprimary text-vprimary-text rounded-full text-sm font-normal uppercase whitespace-nowrap transition-opacity hover:opacity-80">
          <Calendar className="w-4 h-4" />Escolher data<ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ServicoButtons({ servico, profissional, selecaoProfId, servicosSelecionados, isProfessional, onAgendarAgora, onToggleSelecao, isLight }) {
  const isSelecionado = servicosSelecionados.some(x => x.id === servico.id);
  const modoSelecaoOn = servicosSelecionados.length > 0;
  const outroProfSel  = modoSelecaoOn && selecaoProfId !== null && selecaoProfId !== profissional.id;
  const agendarDesabilitado    = !!isProfessional || modoSelecaoOn;
  const selecionarDesabilitado = !!isProfessional || outroProfSel;

  let selecionarClass;
  if (isProfessional || outroProfSel) {
    selecionarClass = 'bg-vcard2 border-vborder text-vmuted cursor-not-allowed opacity-30';
  } else if (isSelecionado) {
    selecionarClass = isLight ? 'bg-vprimary/10 border-vprimary text-vtext' : 'bg-primary/15 border-primary text-primary';
  } else if (modoSelecaoOn) {
    selecionarClass = isLight ? 'bg-vcard border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-vcard2 border-vborder text-white hover:border-primary hover:text-primary';
  } else {
    selecionarClass = isLight ? 'bg-vcard border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-vcard2 border-vborder text-vsub hover:border-primary hover:text-primary';
  }

  const agendarClass = agendarDesabilitado
    ? 'bg-vcard2 border border-vborder text-vmuted cursor-not-allowed opacity-40'
    : isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black hover:opacity-90';

  return (
    <div className="flex gap-2 mt-3">
      <button onClick={() => !agendarDesabilitado && onAgendarAgora(profissional, [servico])} disabled={agendarDesabilitado}
        className={`flex-1 py-2.5 rounded-button text-sm font-normal uppercase transition-all flex items-center justify-center gap-1.5 ${agendarClass}`}>
        <Calendar className="w-3.5 h-3.5" />Agendar
      </button>
      <button onClick={() => !selecionarDesabilitado && onToggleSelecao(profissional, servico)} disabled={selecionarDesabilitado}
        className={`flex-1 py-2.5 rounded-button text-sm font-normal uppercase transition-all flex items-center justify-center gap-1.5 border ${selecionarClass}`}>
        {isSelecionado ? <><Check className="w-3.5 h-3.5" />Selecionado</> : <><ShoppingBag className="w-3.5 h-3.5" />Selecionar</>}
      </button>
    </div>
  );
}

function ServicoCard({ s, profissional, selecaoProfId, servicosSelecionados, isProfessional, onAgendarAgora, onToggleSelecao, isLight }) {
  const preco      = Number(s.preco ?? 0);
  const promo      = Number(s.preco_promocional ?? 0);
  const temPromo   = Number.isFinite(promo) && promo > 0 && promo < preco;
  const precoFinal = getPrecoFinalServico(s);
  return (
    <div className="bg-vcard2 border border-vborder rounded-custom p-4">
      {temPromo ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="font-normal text-sm leading-tight">{s.nome}</div>
            <span className="inline-block px-1.5 py-0.5 rounded-button text-[9px] font-normal uppercase shrink-0" style={{ background: 'var(--voferta-bg)', border: '1px solid var(--voferta-border)', color: 'var(--voferta-text)' }}>OFERTA</span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-vmuted font-normal"><Clock className="w-3 h-3 shrink-0" />{s.duracao_minutos} MIN</div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs line-through" style={{ color: 'var(--verror-text)' }}>R$ {preco.toFixed(2)}</span>
              <span className="font-normal text-base" style={{ color: 'var(--vpromo-text)' }}>R$ {precoFinal.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="font-normal text-sm leading-tight">{s.nome}</div>
            <div className="text-vprimary font-normal text-base shrink-0">R$ {precoFinal.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-vmuted font-normal"><Clock className="w-3 h-3 shrink-0" />{s.duracao_minutos} MIN</div>
        </>
      )}
      <ServicoButtons servico={s} profissional={profissional} selecaoProfId={selecaoProfId} servicosSelecionados={servicosSelecionados} isProfessional={isProfessional} onAgendarAgora={onAgendarAgora} onToggleSelecao={onToggleSelecao} isLight={isLight} />
    </div>
  );
}

function ServicosCarousel({ lista, profissional, selecaoProfId, servicosSelecionados, isProfessional, onAgendarAgora, onToggleSelecao, emptyMsg, isLight }) {
  const [pagina, setPagina]     = useState(0);
  const [animDir, setAnimDir]   = useState(null);
  const [exibindo, setExibindo] = useState(0);
  const [animando, setAnimando] = useState(false);
  const touchStartX             = useRef(null);
  const totalPaginas = Math.ceil(lista.length / SERVICOS_POR_PAGINA);

  useEffect(() => { setPagina(0); setExibindo(0); setAnimDir(null); setAnimando(false); }, [profissional.id]);

  const irPara = (idx) => {
    const alvo = Math.max(0, Math.min(idx, totalPaginas - 1));
    if (alvo === pagina || animando) return;
    const dir = alvo > pagina ? 'left' : 'right';
    setAnimDir(dir); setAnimando(true); setPagina(alvo);
    setTimeout(() => { setExibindo(alvo); setAnimDir(null); setAnimando(false); }, 320);
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) irPara(pagina + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (!lista.length) return <p className="text-vmuted font-normal">{emptyMsg}</p>;

  const paginaAnterior = exibindo;
  const paginaAlvo     = pagina;
  const itensAntigos = lista.slice(paginaAnterior * SERVICOS_POR_PAGINA, paginaAnterior * SERVICOS_POR_PAGINA + SERVICOS_POR_PAGINA);
  const itensNovos   = lista.slice(paginaAlvo    * SERVICOS_POR_PAGINA, paginaAlvo    * SERVICOS_POR_PAGINA + SERVICOS_POR_PAGINA);
  const itensMostrados = animando ? itensAntigos : itensNovos;
  const translateSaindo   = animDir === 'left' ? '-100%' : animDir === 'right' ? '100%' : '0%';
  const translateEntrando = animDir === 'left' ? '100%'  : animDir === 'right' ? '-100%' : '0%';
  const dotInactive = isLight ? 'bg-vborder hover:bg-vsub/40' : 'bg-gray-700 hover:bg-gray-500';
  const navBtnCl    = isLight ? 'hover:bg-vcard2 text-vmuted hover:text-vtext' : 'hover:bg-vcard2 text-vsub hover:text-vtext';

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {animando && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateX(${translateSaindo})`, transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {itensAntigos.map(s => (<ServicoCard key={s.id} s={s} profissional={profissional} selecaoProfId={selecaoProfId} servicosSelecionados={servicosSelecionados} isProfessional={isProfessional} onAgendarAgora={onAgendarAgora} onToggleSelecao={onToggleSelecao} isLight={isLight} />))}
          </div>
        )}
        <div style={{ transform: animando ? `translateX(${translateEntrando})` : 'translateX(0%)', transition: animando ? 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(animando ? itensNovos : itensMostrados).map(s => (<ServicoCard key={s.id} s={s} profissional={profissional} selecaoProfId={selecaoProfId} servicosSelecionados={servicosSelecionados} isProfessional={isProfessional} onAgendarAgora={onAgendarAgora} onToggleSelecao={onToggleSelecao} isLight={isLight} />))}
        </div>
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => irPara(pagina - 1)} disabled={pagina === 0} className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${navBtnCl}`}><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPaginas }).map((_, i) => (<button key={i} onClick={() => irPara(i)} className={['rounded-full transition-all duration-300', i === pagina ? 'w-4 h-2 bg-vprimary' : `w-2 h-2 ${dotInactive}`].join(' ')} aria-label={`Página ${i + 1}`} />))}
          <button onClick={() => irPara(pagina + 1)} disabled={pagina === totalPaginas - 1} className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${navBtnCl}`}><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

function DepoimentosPaginados({ depoimentos, nomeNegocioLabel, isLight }) {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.ceil(depoimentos.length / DEPOIMENTOS_POR_PAGINA);
  const inicio = pagina * DEPOIMENTOS_POR_PAGINA;
  const itens  = depoimentos.slice(inicio, inicio + DEPOIMENTOS_POR_PAGINA);
  const navBtnCl  = isLight ? 'hover:bg-vcard2 text-vmuted hover:text-vtext' : 'hover:bg-vcard2 text-vsub hover:text-vtext';
  const dotInact  = isLight ? 'bg-vborder hover:bg-vsub/40' : 'bg-gray-700 hover:bg-gray-500';
  const comentCl  = isLight ? 'text-vsub' : 'text-vsub';
  if (!depoimentos.length) return <p className="text-vmuted font-normal">Nenhum depoimento ainda</p>;
  return (
    <div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {itens.map(dep => {
          const avatarClienteUrl = getPublicUrl('avatars', dep.users?.avatar_path);
          return (
            <div key={dep.id} className="mb-4 break-inside-avoid bg-vcard border border-vborder rounded-custom p-4 relative">
              <div className="absolute top-3 right-3">
                {dep.profissional_id && dep.profissionais?.nome
                  ? <span className="inline-block px-1.5 py-0.5 bg-vprimary/10 border border-vprimary/30 rounded-button text-[10px] text-vprimary font-normal uppercase">{dep.profissionais.nome}</span>
                  : <span className="inline-block px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-button text-[10px] text-blue-500 font-normal uppercase">{nomeNegocioLabel}</span>
                }
              </div>
              <div className="flex items-center gap-3 mb-3">
                {avatarClienteUrl
                  ? <div className="w-10 h-10 rounded-full overflow-hidden border border-vborder bg-vcard2 shrink-0"><img src={avatarClienteUrl} alt={dep.users?.nome} className="w-full h-full object-cover" /></div>
                  : <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-normal shrink-0">{dep.users?.nome?.[0] || 'A'}</div>
                }
                <div className="flex-1">
                  <p className="text-sm font-normal">{dep.users?.nome || 'Cliente'}</p>
                  <Stars5Char value={dep.nota} size={14} />
                </div>
              </div>
              {dep.comentario && <p className={`text-sm font-normal ${comentCl}`}>{dep.comentario}</p>}
            </div>
          );
        })}
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${navBtnCl}`}><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPaginas }).map((_, i) => (<button key={i} onClick={() => setPagina(i)} className={['rounded-full transition-all duration-300', i === pagina ? 'w-4 h-2 bg-vprimary' : `w-2 h-2 ${dotInact}`].join(' ')} aria-label={`Página ${i + 1}`} />))}
          <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina === totalPaginas - 1} className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${navBtnCl}`}><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

export default function Vitrine({ user, userType }) {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const vitrineMsgs = useMemo(() => ptBR?.vitrine || {}, []);
  const getMsg      = useCallback((key, fallback) => vitrineMsgs?.[key] || fallback, [vitrineMsgs]);

  const [negocio,       setNegocio]       = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [entregas,      setEntregas]      = useState([]);
  const [depoimentos,   setDepoimentos]   = useState([]);
  const [galeriaItems,  setGaleriaItems]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const businessGroup   = useMemo(() => getBusinessGroup(negocio?.tipo_negocio), [negocio?.tipo_negocio]);
  const bizV            = vitrineMsgs?.business || {};
  const sectionTitle    = bizV?.section_title?.[businessGroup]  ?? 'Serviços';
  const counterSingular = ptBR?.vitrine?.business?.counter_singular?.[businessGroup] ?? 'serviço';
  const counterPlural   = ptBR?.vitrine?.business?.counter_plural?.[businessGroup]   ?? 'serviços';
  const emptyListMsg    = ptBR?.vitrine?.business?.empty_list?.[businessGroup]       ?? 'Sem serviços para este profissional.';

  const [nativeAlertOpen,   setNativeAlertOpen]   = useState(false);
  const [nativeAlertData,   setNativeAlertData]   = useState({ title: '', body: '', buttonText: 'OK' });
  const [nativeConfirmOpen, setNativeConfirmOpen] = useState(false);
  const [nativeConfirmData, setNativeConfirmData] = useState({ title: '', body: '', confirmText: 'CONFIRMAR', cancelText: 'CANCELAR' });
  const confirmResolverRef = useRef(null);

  const closeAlert = () => setNativeAlertOpen(false);

  const openAlert = ({ title, body, buttonText }) => {
    setNativeAlertData({ title: title || getMsg('generic_title', 'Aviso'), body: body || '', buttonText: buttonText || 'OK' });
    setNativeAlertOpen(true);
  };

  const alertKey = (key, fallbackTitle, fallbackBody, fallbackBtn = 'OK') => {
    const m = vitrineMsgs?.[key];
    if (m && typeof m === 'object') { openAlert({ title: m.title || fallbackTitle || getMsg('generic_title', 'Aviso'), body: m.body || fallbackBody || '', buttonText: m.buttonText || fallbackBtn || 'OK' }); return; }
    openAlert({ title: fallbackTitle || getMsg('generic_title', 'Aviso'), body: fallbackBody || '', buttonText: fallbackBtn || 'OK' });
  };

  const confirmKey = (key, fallbackTitle, fallbackBody, fallbackConfirm = 'CONFIRMAR', fallbackCancel = 'CANCELAR') => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      const m = vitrineMsgs?.[key];
      setNativeConfirmData({
        title:       (m && m.title)       ? m.title       : (fallbackTitle   || getMsg('generic_title', 'Confirmar')),
        body:        (m && m.body)        ? m.body        : (fallbackBody    || ''),
        confirmText: (m && m.confirmText) ? m.confirmText : fallbackConfirm,
        cancelText:  (m && m.cancelText)  ? m.cancelText  : fallbackCancel,
      });
      setNativeConfirmOpen(true);
    });
  };

  const closeConfirm = (value) => {
    setNativeConfirmOpen(false);
    const r = confirmResolverRef.current;
    confirmResolverRef.current = null;
    if (typeof r === 'function') r(!!value);
  };

  const [isFavorito, setIsFavorito] = useState(false);
  const [serverNow, setServerNow] = useState(() => ({ ts: null, dow: 0, date: '', source: 'db', minutes: 0 }));
  const [calendarExport, setCalendarExport] = useState({ googleUrl: '', icsUrl: '', icsFilename: '' });
  const [flow, setFlow] = useState({ step: 'idle', profissional: null, servicosSelecionados: [], lastSlot: null });
  const [selecaoProfId,        setSelecaoProfId]        = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const todayISO = serverNow.date;

  const [showDepoimento,           setShowDepoimento]           = useState(false);
  const [depoimentoNota,           setDepoimentoNota]           = useState(5);
  const [depoimentoTexto,          setDepoimentoTexto]          = useState('');
  const [depoimentoLoading,        setDepoimentoLoading]        = useState(false);
  const [depoimentoTipo,           setDepoimentoTipo]           = useState('negocio');
  const [depoimentoProfissionalId, setDepoimentoProfissionalId] = useState(null);
  const rebookAppliedRef = useRef(false);

  const isProfessional = user && userType === 'professional';
  const calendarPlatformMode = useMemo(() => getCalendarPlatformMode(), []);

  const fetchNowFromDb = useCallback(async () => {
    let lastErr = null;

    for (const rpcName of NOW_RPC_SEQUENCE) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await supabase.rpc(rpcName);

        if (error) {
          lastErr = error;
          continue;
        }

        const payload = data?.[0] ?? data;
        if (!payload?.date) {
          lastErr = new Error(`${rpcName} vazio`);
          continue;
        }

        setServerNow({
          ts: payload?.ts ?? null,
          dow: Number(payload?.dow ?? 0),
          date: String(payload.date),
          source: payload?.source || rpcName,
          minutes: Number(payload?.minutes ?? 0),
        });
        return payload;
      }
    }

    throw lastErr || new Error('Falha ao obter horário oficial');
  }, []);

  const loadDepoimentos = useCallback(async (negocioId) => {
    const { data, error: rpcErr } = await withTimeout(supabase.rpc('get_depoimentos_vitrine', { p_negocio_id: negocioId }), 7000, 'depoimentos');
    if (rpcErr) throw rpcErr;
    return (data || []).map(d => ({
      ...d,
      users:         d.cliente_nome     ? { nome: d.cliente_nome, avatar_path: d.cliente_avatar_path, type: d.cliente_type } : null,
      profissionais: d.profissional_nome ? { nome: d.profissional_nome } : null,
    }));
  }, []);

  const loadVitrine = useCallback(async () => {
    setLoading(true); setError(null);
    const watchdog = setTimeout(() => { setLoading(false); setError(getMsg('load_timeout', 'Demorou demais para carregar. Tente novamente.')); }, 12000);
    try {
      fetchNowFromDb().catch(() => null);
      const { data: negocioData, error: negocioError } = await withTimeout(supabase.from('negocios').select('*').eq('slug', slug).maybeSingle(), 7000, 'negocio');
      if (negocioError) throw negocioError;
      if (!negocioData) { setNegocio(null); setProfissionais([]); setEntregas([]); setDepoimentos([]); setGaleriaItems([]); return; }
      setNegocio(negocioData);

      const { data: profissionaisData, error: profErr } = await withTimeout(
        supabase.from('profissionais').select('*').eq('negocio_id', negocioData.id).eq('status', 'ativo'),
        7000, 'profissionais'
      );
      if (profErr) throw profErr;
      const profs = profissionaisData || [];
      setProfissionais(profs);

      const profissionalIds = profs.map(p => p.id).filter(Boolean);

      const [entregasResult, galeriaResult, deps] = await Promise.all([
        profissionalIds.length
          ? withTimeout(supabase.from('entregas').select('*').in('profissional_id', profissionalIds).eq('ativo', true), 7000, 'entregas')
          : Promise.resolve({ data: [], error: null }),
        withTimeout(supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocioData.id).order('ordem', { ascending: true }).order('created_at', { ascending: true }), 7000, 'galerias'),
        loadDepoimentos(negocioData.id),
      ]);

      if (entregasResult.error) throw entregasResult.error;
      if (galeriaResult.error)  throw galeriaResult.error;

      setEntregas(entregasResult.data || []);
      setGaleriaItems(galeriaResult.data || []);
      setDepoimentos(deps);
    } catch (e) {
      setError(e?.message || getMsg('load_error', 'Erro ao carregar a vitrine.'));
      setNegocio(null); setProfissionais([]); setEntregas([]); setDepoimentos([]); setGaleriaItems([]);
    } finally {
      clearTimeout(watchdog);
      setLoading(false);
    }
  }, [slug, loadDepoimentos, getMsg, fetchNowFromDb]);

  const checkFavorito = useCallback(async () => {
    if (!user || userType !== 'client' || !negocio?.id) { setIsFavorito(false); return; }
    try {
      const { data, error: favErr } = await withTimeout(supabase.from('favoritos').select('id').eq('cliente_id', user.id).eq('tipo', 'negocio').eq('negocio_id', negocio.id).maybeSingle(), 6000, 'favorito');
      if (favErr) throw favErr;
      setIsFavorito(!!data);
    } catch { setIsFavorito(false); }
  }, [user, userType, negocio?.id]);

  useEffect(() => { loadVitrine(); }, [loadVitrine]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchNowFromDb().catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchNowFromDb]);

  useEffect(() => {
    if (!user) return;
    fetchNowFromDb().catch(() => {});
  }, [user, fetchNowFromDb]);

  useEffect(() => {
    if (user && negocio?.id) checkFavorito();
    else setIsFavorito(false);
  }, [checkFavorito, negocio?.id, user]);

  useEffect(() => {
    return () => {
      if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    };
  }, [calendarExport.icsUrl]);

  useEffect(() => {
    const rebook = location.state?.rebook;
    if (rebookAppliedRef.current || !rebook || loading || !negocio?.id) return;
    const profissional = profissionais.find((p) => p.id === rebook.profissionalId);
    const servico = entregas.find((s) =>
      s.id === rebook.entregaId &&
      s.profissional_id === rebook.profissionalId &&
      s.ativo !== false
    );
    if (!profissional || !servico) return;
    rebookAppliedRef.current = true;
    setSelecaoProfId(null);
    setServicosSelecionados([]);
    if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    setCalendarExport({ googleUrl: '', icsUrl: '', icsFilename: '' });
    setFlow({ step: 'booking', profissional, servicosSelecionados: [servico], lastSlot: null });
    navigate(location.pathname, { replace: true, state: {} });
  }, [calendarExport.icsUrl, location.pathname, location.state, loading, negocio?.id, profissionais, entregas, navigate]);

  const toggleFavorito = async () => {
    if (!user) { alertKey('favorite_need_login', 'Login necessário', 'Faça login para favoritar.', 'ENTENDI'); return; }
    if (userType !== 'client') { alertKey('favorite_only_client', 'Ação restrita', 'Apenas CLIENTE pode favoritar negócios.', 'ENTENDI'); return; }
    if (!negocio?.id) { alertKey('favorite_invalid_business', 'Negócio inválido', 'Negócio inválido.', 'ENTENDI'); return; }
    try {
      if (isFavorito) {
        const { error: delErr } = await supabase.from('favoritos').delete().eq('cliente_id', user.id).eq('tipo', 'negocio').eq('negocio_id', negocio.id);
        if (delErr) throw delErr;
        setIsFavorito(false);
      } else {
        const { error: insErr } = await supabase.from('favoritos').insert({ cliente_id: user.id, tipo: 'negocio', negocio_id: negocio.id, profissional_id: null });
        if (insErr) throw insErr;
        setIsFavorito(true);
      }
    } catch { alertKey('favorite_toggle_error', 'Erro', 'Erro ao favoritar. Tente novamente.', 'OK'); }
  };

  const requireLogin = async () => {
    if (!user) {
      const ok = await confirmKey('schedule_need_login_confirm', 'Login necessário', 'Você precisa fazer login para agendar. Deseja fazer login agora?', 'IR PARA LOGIN', 'MAIS TARDE');
      if (ok) navigate('/login');
      return false;
    }
    if (userType !== 'client') { alertKey('schedule_only_client', 'Ação restrita', 'Você está logado como PROFISSIONAL. Para agendar, entre como CLIENTE.', 'ENTENDI'); return false; }
    if (!todayISO) {
      try {
        await fetchNowFromDb();
      } catch {
        alertKey('schedule_time_unavailable', 'Horário oficial indisponível', 'Ainda estamos sincronizando o horário oficial. Tente novamente em instantes.', 'ENTENDI');
        return false;
      }
    }
    return true;
  };

  const handleAgendarAgora = async (profissional, servicos) => {
    if (!(await requireLogin())) return;
    if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    setSelecaoProfId(null); setServicosSelecionados([]); setCalendarExport({ googleUrl: '', icsUrl: '', icsFilename: '' });
    setFlow({ step: 'booking', profissional, servicosSelecionados: servicos, lastSlot: null });
  };

  const handleToggleSelecao = async (profissional, servico) => {
    if (!(await requireLogin())) return;
    setServicosSelecionados(prev => {
      const jaTemEsseProf = selecaoProfId && selecaoProfId !== profissional.id;
      if (jaTemEsseProf) return prev;
      const existe = prev.some(x => x.id === servico.id);
      const proximo = existe ? prev.filter(x => x.id !== servico.id) : [...prev, servico];
      if (proximo.length === 0) setSelecaoProfId(null);
      else setSelecaoProfId(profissional.id);
      return proximo;
    });
  };

  const handleConfirmarSelecao = () => {
    if (!servicosSelecionados.length) return;
    const profissional = profissionais.find(p => p.id === selecaoProfId);
    if (!profissional) return;
    if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    setCalendarExport({ googleUrl: '', icsUrl: '', icsFilename: '' });
    setFlow({ step: 'booking', profissional, servicosSelecionados, lastSlot: null });
    setSelecaoProfId(null); setServicosSelecionados([]);
  };

  const handleLimparSelecao = () => { setSelecaoProfId(null); setServicosSelecionados([]); };

  const entregaVirtual = useMemo(() => {
    if (!flow.servicosSelecionados?.length) return null;
    const primeiroServico = flow.servicosSelecionados[0];
    const durTotal = flow.servicosSelecionados.reduce((sum, s) => sum + Number(s?.duracao_minutos || 0), 0);
    const valTotal = flow.servicosSelecionados.reduce((sum, s) => sum + getPrecoFinalServico(s), 0);
    return {
      id: primeiroServico.id,
      nome: flow.servicosSelecionados.length === 1 ? primeiroServico.nome : `${flow.servicosSelecionados.length} ${counterPlural}`,
      duracao_minutos: durTotal,
      preco: valTotal,
      preco_promocional: null,
      entrega_ids: flow.servicosSelecionados.map(servico => servico.id).filter(Boolean),
    };
  }, [flow.servicosSelecionados, counterPlural]);

  const handleBookingConfirm = (slot) => {
    const primeiroServico = flow.servicosSelecionados?.[0];
    const durTotal = (flow.servicosSelecionados || []).reduce((sum, s) => sum + Number(s?.duracao_minutos || 0), 0);
    const serviceNames = (flow.servicosSelecionados || []).map((s) => s?.nome).filter(Boolean);
    const titulo = primeiroServico?.nome || 'Agendamento';
    const detalhes = [
      'Agendamento confirmado pelo Comvaga.',
      flow.profissional?.nome ? `Profissional: ${flow.profissional.nome}` : '',
      serviceNames.length ? `Serviços: ${serviceNames.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const local = negocio?.endereco || nomeNegocioLabel || '';
    const googleUrl = gerarLinkGoogle({
      titulo,
      dataISO: slot.dataISO,
      inicioHHMM: slot.inicio,
      duracaoMin: durTotal,
      detalhes,
      local,
    });
    const icsFile = gerarArquivoICS({
      titulo,
      dataISO: slot.dataISO,
      inicioHHMM: slot.inicio,
      duracaoMin: durTotal,
      detalhes,
      local,
      uidSeed: `${negocio?.id || 'negocio'}-${flow.profissional?.id || 'profissional'}-${slot.dataISO}-${slot.inicio}`,
    });
    const icsBlob = new Blob([icsFile.content], { type: 'text/calendar;charset=utf-8' });
    if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    const icsUrl = URL.createObjectURL(icsBlob);
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.sendTags({ ultima_acao: 'agendamento_realizado', servico_nome: primeiroServico?.nome || 'Servico', data_agendamento: slot.dataISO, horario_agendamento: slot.label });
      });
    }
    setCalendarExport({ googleUrl, icsUrl, icsFilename: icsFile.filename });
    setFlow(prev => ({ ...prev, step: 'confirmado', lastSlot: slot }));
  };

  const abrirGoogleAgenda = useCallback(() => {
    if (!calendarExport.googleUrl) return;
    window.open(calendarExport.googleUrl, '_blank', 'noopener,noreferrer');
  }, [calendarExport.googleUrl]);

  const baixarEventoICS = useCallback(() => {
    if (!calendarExport.icsUrl) return;
    const link = document.createElement('a');
    link.href = calendarExport.icsUrl;
    link.download = calendarExport.icsFilename || 'evento.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [calendarExport.icsFilename, calendarExport.icsUrl]);

  const calendarActionConfig = useMemo(() => {
    if (calendarPlatformMode === 'google-with-fallback') {
      return {
        hint: 'Abrir no Google Agenda. Se não abrir no seu celular, baixe o evento.',
        primaryLabel: 'ABRIR NO GOOGLE AGENDA',
        primaryAction: abrirGoogleAgenda,
        secondaryLabel: 'SE NÃO ABRIR, BAIXAR EVENTO (.ICS)',
        secondaryAction: baixarEventoICS,
      };
    }
    if (calendarPlatformMode === 'ics') {
      return {
        hint: 'Baixar evento compatível com Calendário do iPhone, Mac e Outlook.',
        primaryLabel: 'BAIXAR EVENTO DO CALENDÁRIO',
        primaryAction: baixarEventoICS,
        secondaryLabel: '',
        secondaryAction: null,
      };
    }
    return {
      hint: 'Baixar evento compatível com os principais aplicativos de calendário.',
      primaryLabel: 'BAIXAR EVENTO DO CALENDÁRIO',
      primaryAction: baixarEventoICS,
      secondaryLabel: '',
      secondaryAction: null,
    };
  }, [abrirGoogleAgenda, baixarEventoICS, calendarPlatformMode]);

  const abrirDepoimento = async () => {
    if (!user) {
      const ok = await confirmKey('review_need_login_confirm', 'Login necessário', 'Você precisa fazer login para deixar um depoimento. Deseja fazer login agora?', 'IR PARA LOGIN', 'MAIS TARDE');
      if (ok) navigate('/login');
      return;
    }
    if (userType !== 'client') { alertKey('review_only_client', 'Ação restrita', 'Apenas CLIENTE pode deixar depoimentos.', 'ENTENDI'); return; }
    setDepoimentoNota(5); setDepoimentoTexto(''); setDepoimentoTipo('negocio'); setDepoimentoProfissionalId(null); setShowDepoimento(true);
  };

  const enviarDepoimento = async () => {
    if (!user || userType !== 'client') return;
    if (!negocio?.id) { alertKey('review_invalid_business', 'Negócio inválido', 'Negócio inválido.', 'ENTENDI'); return; }
    try {
      setDepoimentoLoading(true);
      const payload = { cliente_id: user.id, tipo: depoimentoTipo, nota: depoimentoNota, comentario: depoimentoTexto || null, negocio_id: depoimentoTipo === 'negocio' ? negocio.id : null, profissional_id: depoimentoTipo === 'profissional' ? depoimentoProfissionalId : null };
      const { error: depErr } = await withTimeout(supabase.from('depoimentos').insert(payload), 7000, 'enviar-depoimento');
      if (depErr) throw depErr;
      setShowDepoimento(false);
      const deps = await loadDepoimentos(negocio.id);
      setDepoimentos(deps);
      alertKey('review_sent', 'Depoimento registrado', 'Seu depoimento foi entregue com sucesso!', 'OK');
    } catch (e) {
      openAlert({ title: getMsg('review_send_error_title', 'Erro ao enviar depoimento'), body: `${getMsg('review_send_error_body', 'Erro ao enviar depoimento:')} ${e?.message || ''}`, buttonText: getMsg('common_ok', 'ENTENDI') });
    } finally { setDepoimentoLoading(false); }
  };

  const logoUrl      = useMemo(() => getPublicUrl('logos',   negocio?.logo_path), [negocio?.logo_path]);
  const instagramUrl = useMemo(() => resolveInstagram(negocio?.instagram),        [negocio?.instagram]);
  const facebookUrl  = useMemo(() => resolveFacebook(negocio?.facebook),          [negocio?.facebook]);

  const getAlmocoRange = (p) => ({ ini: p?.almoco_inicio || null, fim: p?.almoco_fim || null });

  const isInLunchNow = (p) => {
    const { ini, fim } = getAlmocoRange(p);
    if (!ini || !fim) return false;
    const a = timeToMinutes(ini), b = timeToMinutes(fim);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (b < a) return (serverNow.minutes >= a || serverNow.minutes < b);
    return (serverNow.minutes >= a && serverNow.minutes < b);
  };

  const getProfStatus = (p) => {
    if (p?.status !== 'ativo') return { label: 'FECHADO', color: 'bg-red-500' };
    if (!serverNow.date) return null;
    const ini = timeToMinutes(p?.horario_inicio || '08:00');
    const fim = timeToMinutes(p?.horario_fim    || '18:00');
    const dias = normalizeDiasTrabalho(p?.dias_trabalho);
    const diasEfetivos = dias.length ? dias : [0, 1, 2, 3, 4, 5, 6];
    const hojeDow = getDowFromDateSP(serverNow.date);
    const trabalhaHoje = hojeDow == null ? true : diasEfetivos.includes(hojeDow);
    const dentroHorario = serverNow.minutes >= ini && serverNow.minutes < fim;
    if (!(trabalhaHoje && dentroHorario)) return { label: 'FECHADO', color: 'bg-red-500' };
    if (isInLunchNow(p)) return { label: 'ALMOÇO', color: 'bg-yellow-400' };
    return { label: 'ABERTO', color: 'bg-green-500' };
  };

  const entregasPorProf = useMemo(() => {
    const map = new Map();
    for (const p of profissionais) map.set(p.id, []);
    for (const s of entregas) { if (!map.has(s.profissional_id)) map.set(s.profissional_id, []); map.get(s.profissional_id).push(s); }
    return map;
  }, [profissionais, entregas]);

  const depoimentosPorProf = useMemo(() => {
    const map = new Map();
    for (const dep of depoimentos) { if (dep.profissional_id) { if (!map.has(dep.profissional_id)) map.set(dep.profissional_id, []); map.get(dep.profissional_id).push(dep); } }
    const medias = new Map();
    for (const [profId, deps] of map.entries()) {
      const media = deps.length > 0 ? (deps.reduce((sum, d) => sum + d.nota, 0) / deps.length).toFixed(1) : null;
      medias.set(profId, { media, count: deps.length });
    }
    return medias;
  }, [depoimentos]);

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-primary text-2xl font-normal animate-pulse">CARREGANDO...</div></div>);
  if (error)   return (<div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="max-w-md w-full bg-dark-100 border border-red-500/40 rounded-custom p-8 text-center"><AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" /><h1 className="text-2xl font-normal text-white mb-2">Houve um erro ao carregar</h1><p className="text-gray-400 mb-6">{error}</p><button onClick={loadVitrine} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button font-normal uppercase">Tentar novamente</button></div></div>);
  if (!negocio) return (<div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="text-center"><h1 className="text-3xl font-normal text-white mb-4">Negócio inexistente.</h1><Link to="/" className="text-primary hover:text-yellow-500 font-normal">Voltar para Home</Link></div></div>);

  const depoimentosNegocio = depoimentos.filter(d => d.tipo === 'negocio');
  const mediaDepoimentos = depoimentosNegocio.length > 0 ? (depoimentosNegocio.reduce((sum, d) => sum + d.nota, 0) / depoimentosNegocio.length).toFixed(1) : '0.0';
  const nomeNegocioLabel = String(negocio?.nome || '').trim() || 'NEGÓCIO';
  const temaAtivo = negocio?.tema || 'dark';
  const isLight   = temaAtivo === 'light';
  const hasSelecao = servicosSelecionados.length > 0;

  const headerVoltar    = isLight ? 'text-vsub hover:text-vtext' : 'text-vsub hover:text-primary';
  const depoimentoBtn   = isLight ? (isProfessional ? 'border-vborder2 text-vmuted cursor-not-allowed bg-vcard2' : 'border-vborder text-vsub hover:border-vprimary hover:text-vtext bg-vcard') : (isProfessional ? 'border-vborder2 text-vmuted cursor-not-allowed bg-vcard2' : 'border-vborder text-vsub hover:border-primary bg-vcard2');
  const favoritoBtn     = isLight ? (isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : isFavorito ? 'bg-red-50 border-red-300 text-red-500' : 'bg-vcard border-vborder text-vsub hover:text-red-500 hover:border-red-300') : (isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : isFavorito ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-vcard2 border-vborder text-vsub hover:text-red-400');
  const socialIconCl    = isLight ? 'border-vborder bg-vcard text-vsub hover:bg-vcard2 hover:border-vprimary/40 hover:text-vtext' : 'border-white/20 bg-white/7 text-white/80 hover:bg-white/15 hover:border-white/35';
  const heroBg          = isLight ? 'bg-[linear-gradient(135deg,var(--vcard)_0%,var(--vbg)_48%,var(--vcard2)_100%)]' : 'bg-gradient-to-br from-primary/20 via-vbg to-yellow-600/20';
  const telClass        = isLight ? 'text-vtext hover:text-vsub' : 'text-primary hover:text-yellow-500';
  const addrClass       = isLight ? 'text-vsub' : 'text-vsub';
  const mediaColor      = isLight ? 'text-vtext' : 'text-primary';
  const profissaoTag    = isLight ? 'bg-vcard2 border-vborder text-vtext' : 'bg-primary/20 border-primary/30 text-primary';
  const almocoBadge     = isLight ? 'text-amber-700' : 'text-yellow-400';
  const depBtn          = isLight ? (isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : 'bg-vcard2 hover:bg-vcard border-vborder text-vtext') : (isProfessional ? 'bg-vcard border-vborder2 text-vmuted cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary');
  const depoModalBg     = isLight ? 'bg-vcard border-vborder' : 'bg-dark-100 border-gray-800';
  const depoModalTitle  = isLight ? 'text-vtext' : 'text-white';
  const depoModalClose  = isLight ? 'text-vmuted hover:text-vtext' : 'text-gray-400 hover:text-white';
  const depoModalLabel  = isLight ? 'text-vsub' : 'text-gray-300';
  const depoNegBtn      = (t) => t === 'negocio' ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-blue-500/20 border-blue-500/50 text-blue-400') : (isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-400');
  const depoProfBtn     = (t) => t === 'profissional' ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-primary/20 border-primary/50 text-primary') : (isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-400');
  const depoProfItem    = (sel) => sel ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-primary/20 border-primary/50 text-primary') : (isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-400 hover:border-primary/30');
  const depoNotaBtn     = (n) => depoimentoNota >= n ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-primary/20 border-primary/50 text-primary') : (isLight ? 'bg-vcard2 border-vborder text-vmuted' : 'bg-dark-200 border-gray-800 text-gray-500');
  const depoTextarea    = isLight ? 'bg-vcard border-vborder text-vtext placeholder-vmuted focus:border-vprimary' : 'bg-dark-200 border-gray-800 text-white placeholder-gray-500 focus:border-primary';
  const depoSendBtn     = isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black';
  const depoHintCl      = isLight ? 'text-vmuted' : 'text-gray-500';
  const confirmadoBg    = isLight ? 'bg-vcard border-vborder' : 'bg-dark-100 border-gray-800';
  const confirmadoTitle = isLight ? 'text-vtext' : 'text-white';
  const confirmadoSub   = isLight ? 'text-vsub' : 'text-gray-500';
  const confirmadoHora  = isLight ? 'text-vtext font-bold' : 'text-primary';
  const confirmadoData  = isLight ? 'text-vsub' : 'text-gray-400';
  const confirmadoAgBtn = isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black';

  return (
    <div className={`min-h-screen bg-vbg text-vtext${isLight ? ' vitrine-light' : ''}`} style={hasSelecao ? { paddingBottom: 72 } : undefined}>
      <AlertModal  open={nativeAlertOpen}   onClose={closeAlert} title={nativeAlertData.title} body={nativeAlertData.body} buttonText={nativeAlertData.buttonText} isLight={isLight} />
      <ConfirmModal open={nativeConfirmOpen} onCancel={() => closeConfirm(false)} onConfirm={() => closeConfirm(true)} title={nativeConfirmData.title} body={nativeConfirmData.body} confirmText={nativeConfirmData.confirmText} cancelText={nativeConfirmData.cancelText} isLight={isLight} />

      <div className="bg-primary overflow-hidden relative h-10 flex items-center">
        <div className="announcement-bar-marquee flex whitespace-nowrap">
          <div className="flex animate-marquee-sync">
            <div className="flex items-center shrink-0">{[...Array(20)].map((_, i) => (<div key={`a-${i}`} className="flex items-center"><span className="text-black font-normal text-sm uppercase mx-4">É DE MINAS</span><span className="text-black text-sm">●</span></div>))}</div>
            <div className="flex items-center shrink-0" aria-hidden="true">{[...Array(20)].map((_, i) => (<div key={`b-${i}`} className="flex items-center"><span className="text-black font-normal text-sm uppercase mx-4">É DE MINAS</span><span className="text-black text-sm">●</span></div>))}</div>
          </div>
        </div>
        <style>{`@keyframes marquee-sync{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.animate-marquee-sync{display:flex;animation:marquee-sync 40s linear infinite}.announcement-bar-marquee:hover .animate-marquee-sync{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.animate-marquee-sync{animation:none}}`}</style>
      </div>

      <header className="bg-vcard border-b border-vborder sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className={`flex items-center gap-2 transition-colors uppercase ${headerVoltar}`}><ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">Voltar</span></button>
            <div className="flex items-center gap-2">
              <button onClick={abrirDepoimento} disabled={!!isProfessional} className={`flex items-center gap-2 h-9 px-5 rounded-button transition-all border uppercase focus:outline-none focus:ring-0 ${depoimentoBtn}`}>
                <StarChar size={18} className="text-primary" /><span className="hidden sm:inline">Depoimento</span>
              </button>
              <button onClick={toggleFavorito} disabled={!!isProfessional} className={`h-9 flex items-center gap-2 px-5 rounded-button transition-all uppercase border focus:outline-none focus:ring-0 ${favoritoBtn}`}>
                <HeartIcon filled={isFavorito} size={20} className={isFavorito ? 'text-red-500' : ''} />
                <span className="hidden sm:inline">{isProfessional ? 'Somente Cliente' : (isFavorito ? 'Favoritado' : 'Favoritar')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className={`relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${heroBg}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {logoUrl
              ? (<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-vborder bg-vcard"><img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /></div>)
              : (<div className="w-20 h-20 sm:w-24 sm:h-24 bg-vprimary rounded-custom flex items-center justify-center text-4xl sm:text-5xl font-normal text-vprimary-text">{negocio.nome?.[0] || 'N'}</div>)
            }
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal">{negocio.nome}</h1>
                <img src={negocioVerificadoIcon} alt="Negócio verificado" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
              </div>
              <p className="text-base sm:text-lg text-vsub mb-4 font-normal">{negocio.descricao}</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2"><StarChar size={18} className="text-primary" /><span className={`text-xl font-normal ${mediaColor}`}>{mediaDepoimentos}</span></div>
                {negocio.endereco && (<div className={`flex items-center gap-2 text-sm ${addrClass}`}><MapPin className="w-4 h-4" strokeWidth={1.5} /><span className="font-normal">{negocio.endereco}</span></div>)}
                {negocio.telefone && (<a href={`tel:${sanitizeTel(negocio.telefone) || negocio.telefone}`} className={`flex items-center gap-2 text-sm font-normal transition-colors ${telClass}`}><Phone className="w-4 h-4" strokeWidth={1.5} />{negocio.telefone}</a>)}
                {(instagramUrl || facebookUrl) && (
                  <div className="flex items-center gap-2">
                    {instagramUrl && (<a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${socialIconCl}`}><InstagramIcon className="w-[18px] h-[18px]" size={18} /></a>)}
                    {facebookUrl  && (<a href={facebookUrl}  target="_blank" rel="noreferrer" aria-label="Facebook"  className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${socialIconCl}`}><FacebookIcon size={18} /></a>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-normal mb-6">Profissionais</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
            {profissionais.map(prof => {
              const totalEntregas = (entregasPorProf.get(prof.id) || []).length;
              const status    = getProfStatus(prof);
              const depInfo   = depoimentosPorProf.get(prof.id);
              const profissao = String(prof?.profissao ?? '').trim();
              const { ini: almIni, fim: almFim } = getAlmocoRange(prof);
              const avatarUrl  = getPublicUrl('avatars', prof.avatar_path);
              const horarioIni = String(prof.horario_inicio || '08:00').slice(0, 5);
              const horarioFim = String(prof.horario_fim    || '18:00').slice(0, 5);
              return (
                <div key={prof.id} className="mb-6 break-inside-avoid bg-vcard border border-vborder rounded-custom p-6 hover:border-vprimary/50 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    {avatarUrl
                      ? (<div className="w-14 h-14 rounded-custom overflow-hidden border border-vborder bg-vcard2 shrink-0"><img src={avatarUrl} alt={prof.nome} className="w-full h-full object-cover" /></div>)
                      : (<div className="w-14 h-14 bg-vprimary rounded-custom flex items-center justify-center text-2xl font-normal text-vprimary-text shrink-0">{prof.nome?.[0] || 'P'}</div>)
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-lg font-normal">{prof.nome}</h3>
                        {profissao && (<span className={`inline-block px-2 py-1 rounded-button text-[10px] font-normal uppercase whitespace-nowrap shrink-0 border ${profissaoTag}`}>{profissao}</span>)}
                      </div>
                      {status?.label && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.color}`} />
                          <span className="text-xs text-vsub font-normal uppercase">{status.label}</span>
                        </div>
                      )}
                      {depInfo?.media && (<div className="flex items-center gap-2 mb-1"><StarChar size={16} className="text-primary" /><span className={`text-lg font-normal ${mediaColor}`}>{depInfo.media}</span><span className="text-xs text-vmuted">({depInfo.count})</span></div>)}
                      {prof.anos_experiencia != null && (<p className="text-sm text-vmuted font-normal">{prof.anos_experiencia} ano(s) de experiência</p>)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal"><Clock className="w-3 h-3 shrink-0" />{horarioIni} - {horarioFim}</span>
                    {almIni && almFim && (<span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal"><span className={`ml-1 ${almocoBadge}`}> • {String(almIni).slice(0, 5)} - {String(almFim).slice(0, 5)}</span></span>)}
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">{totalEntregas} {totalEntregas === 1 ? counterSingular : counterPlural}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-normal mb-6">{sectionTitle}</h2>
          {profissionais.length === 0 ? (
            <p className="text-vmuted font-normal">{emptyListMsg}</p>
          ) : (
            <div className="space-y-4">
              {profissionais.map(p => {
                const lista = (entregasPorProf.get(p.id) || []).slice().sort((a, b) => {
                  const pa = Number(getPrecoFinalServico(a) ?? 0); const pb = Number(getPrecoFinalServico(b) ?? 0);
                  if (pb !== pa) return pb - pa;
                  return String(a.nome || '').localeCompare(String(b.nome || ''));
                });
                return (
                  <div key={p.id} className="bg-vcard border border-vborder rounded-custom p-6 hover:border-vprimary/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-normal text-lg">{p.nome}</div>
                      <div className="text-xs text-vmuted font-normal">{lista.length} {lista.length === 1 ? counterSingular : counterPlural}</div>
                    </div>
                    <ServicosCarousel lista={lista} profissional={p} selecaoProfId={selecaoProfId} servicosSelecionados={servicosSelecionados} isProfessional={isProfessional} onAgendarAgora={handleAgendarAgora} onToggleSelecao={handleToggleSelecao} emptyMsg={emptyListMsg} isLight={isLight} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {galeriaItems.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {galeriaItems.map((item) => {
                const url = getPublicUrl('galerias', item.path);
                if (!url) return null;
                return (<div key={item.id} className="mb-3 w-full break-inside-avoid overflow-hidden rounded-custom border border-vborder bg-vcard"><img src={url} alt="Galeria" className="w-full h-auto object-contain bg-vbg" loading="lazy" /></div>);
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-normal">Depoimentos</h2>
            <button onClick={abrirDepoimento} disabled={!!isProfessional} className={`px-5 py-2 border rounded-button text-sm transition-all uppercase font-normal ${depBtn}`}>+ Depoimento</button>
          </div>
          <DepoimentosPaginados depoimentos={depoimentos} nomeNegocioLabel={nomeNegocioLabel} isLight={isLight} />
        </div>
      </section>

      <SelectionBar itens={servicosSelecionados} counterSingular={counterSingular} counterPlural={counterPlural} onConfirm={handleConfirmarSelecao} onClear={handleLimparSelecao} isLight={isLight} />

      {flow.step === 'booking' && entregaVirtual && (
        <BookingCalendar profissional={flow.profissional} entrega={entregaVirtual} todayISO={todayISO} negocioId={negocio.id} clienteId={user?.id} onConfirm={handleBookingConfirm} onClose={() => setFlow(prev => ({ ...prev, step: 'idle' }))} temaAtivo={temaAtivo} />
      )}

      {flow.step === 'confirmado' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-custom max-w-md w-full ${confirmadoBg}`}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-10 h-10 text-green-500" /></div>
              <h3 className={`text-2xl font-normal mb-2 ${confirmadoTitle}`}>AGENDADO :)</h3>
              <p className="font-normal mb-1">
                {flow.lastSlot?.label && <span className={`font-normal ${confirmadoHora}`}>{flow.lastSlot.label}</span>}
                {flow.lastSlot?.dataISO && <span className={confirmadoData}> - {formatDateBR(flow.lastSlot.dataISO)}</span>}
              </p>
              <div className={`rounded-custom border p-4 text-left mb-6 ${isLight ? 'bg-[#f8f2eb] border-[#ccb59f]' : 'bg-white/5 border-white/10'}`}>
                <p className={`font-normal text-sm mb-3 ${confirmadoSub}`}>Crie um lembrete no seu celular para assegurar o compromisso.</p>
                <p className={`font-normal text-xs uppercase mb-4 ${isLight ? 'text-[#9a6c4c]' : 'text-[#c7b19c]'}`}>{calendarActionConfig.hint}</p>
                <button onClick={calendarActionConfig.primaryAction} className={`w-full py-4 rounded-button uppercase font-normal transition-colors ${confirmadoAgBtn}`}>
                  {calendarActionConfig.primaryLabel}
                </button>
                {calendarActionConfig.secondaryAction && (
                  <button
                    onClick={calendarActionConfig.secondaryAction}
                    className={`w-full py-3 rounded-button uppercase font-normal mt-3 transition-colors border ${isLight ? 'border-[#c6a98d] text-[#4a2f1d] hover:bg-[#ead9c9]' : 'border-white/15 text-white hover:bg-white/8'}`}
                  >
                    {calendarActionConfig.secondaryLabel}
                  </button>
                )}
              </div>
              <button onClick={() => { setFlow(prev => ({ ...prev, step: 'idle' })); navigate('/minha-area'); }} className="w-full py-3 bg-transparent border border-red-500 text-red-500 rounded-button uppercase font-normal hover:bg-red-500/10 transition-colors">PREFIRO ESQUECER</button>
            </div>
          </div>
        </div>
      )}

      {showDepoimento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-custom max-w-md w-full max-h-[90vh] flex flex-col ${depoModalBg}`}>
            <div className="flex justify-between items-center p-6 pb-4 shrink-0">
              <h3 className={`text-2xl font-normal ${depoModalTitle}`}>DEPOIMENTO</h3>
              <button onClick={() => setShowDepoimento(false)} className={depoModalClose}><X className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 flex-1">
              <div className="mb-4">
                <div className={`text-sm font-normal mb-2 ${depoModalLabel}`}>Você está deixando um depoimento sobre</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setDepoimentoTipo('negocio'); setDepoimentoProfissionalId(null); }} className={`px-4 py-3 rounded-custom border transition-all font-normal ${depoNegBtn(depoimentoTipo)}`}>{nomeNegocioLabel}</button>
                  <button onClick={() => setDepoimentoTipo('profissional')} className={`px-4 py-3 rounded-custom border transition-all font-normal ${depoProfBtn(depoimentoTipo)}`}>PROFISSIONAL</button>
                </div>
              </div>
              {depoimentoTipo === 'profissional' && (
                <div className="mb-4">
                  <div className={`text-sm font-normal mb-2 ${depoModalLabel}`}>Qual profissional?</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {profissionais.map(prof => (<button key={prof.id} onClick={() => setDepoimentoProfissionalId(prof.id)} className={`w-full text-left px-4 py-3 rounded-custom border transition-all font-normal ${depoProfItem(depoimentoProfissionalId === prof.id)}`}>{prof.nome}</button>))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <div className={`text-sm font-normal mb-2 ${depoModalLabel}`}>Nota</div>
                <div className="flex gap-2">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setDepoimentoNota(n)} className={`w-12 h-8 rounded-button border transition-all font-normal ${depoNotaBtn(n)}`}>{n}</button>))}</div>
              </div>
              <div className="mb-5">
                <div className={`text-sm font-normal mb-2 ${depoModalLabel}`}>Comentário é opcional</div>
                <textarea value={depoimentoTexto} onChange={(e) => setDepoimentoTexto(e.target.value)} rows={4} className={`w-full px-4 py-3 border rounded-custom focus:outline-none resize-none font-normal ${depoTextarea}`} placeholder="Conte como foi sua experiência..." />
              </div>
              <button onClick={enviarDepoimento} disabled={depoimentoLoading || (depoimentoTipo === 'profissional' && !depoimentoProfissionalId)} className={`w-full py-3 rounded-button disabled:opacity-60 uppercase font-normal transition-colors ${depoSendBtn}`}>
                {depoimentoLoading ? 'ENVIANDO...' : 'ENVIAR DEPOIMENTO'}
              </button>
              <p className={`text-xs mt-3 font-normal ${depoHintCl}`}>{depoimentoTipo === 'profissional' && !depoimentoProfissionalId ? 'Selecione um profissional para continuar' : 'Somente clientes logados podem deixar depoimentos.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
