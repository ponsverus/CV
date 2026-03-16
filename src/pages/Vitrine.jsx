import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  X,
  AlertCircle,
  Instagram,
  Check,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '../supabase';
import { ptBR } from '../feedback/messages/ptBR';
import { getBusinessGroup } from '../businessTerms';
import BookingCalendar from '../components/BookingCalendar';

const FOLGA_MINUTOS = 5;
const SERVICOS_POR_PAGINA = 4;

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

function getNowSP() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find(p => p.type === type)?.value;
  const y = get('year'), mo = get('month'), d = get('day');
  const hh = get('hour'), mm = get('minute');
  return { date: `${y}-${mo}-${d}`, minutes: (Number(hh) * 60) + Number(mm) };
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

function gerarLinkGoogle(titulo, dataInicioISO, duracaoMin) {
  const fmt = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const inicio = new Date(dataInicioISO);
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${fmt(inicio)}/${fmt(fim)}&details=Agendamento+confirmado+pelo+Comvaga&sf=true&output=xml`;
}

function FacebookIcon({ className = '', size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
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

function StarChar({ size = 18, className = 'text-primary' }) {
  return <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">★</span>;
}

function Stars5Char({ value = 0, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${v} de 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, lineHeight: 1 }} className={i <= v ? 'text-primary' : 'text-gray-700'} aria-hidden="true">★</span>
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

function AlertModal({ open, onClose, title, body, buttonText }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-6">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="text-xl font-normal text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        {body && <p className="text-gray-300 font-normal whitespace-pre-line">{body}</p>}
        <button onClick={onClose} className="mt-5 w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal">
          {buttonText || 'OK'}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ open, onCancel, onConfirm, title, body, confirmText, cancelText }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-6">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="text-xl font-normal text-white">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        {body && <p className="text-gray-300 font-normal whitespace-pre-line">{body}</p>}
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-dark-200 border border-gray-800 rounded-button uppercase font-normal text-gray-200">{cancelText || 'CANCELAR'}</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal">{confirmText || 'CONFIRMAR'}</button>
        </div>
      </div>
    </div>
  );
}

function SelectionBar({ itens, counterSingular, counterPlural, onConfirm, onClear }) {
  const qtd = itens.length;
  if (qtd === 0) return null;
  const durTotal = itens.reduce((s, x) => s + Number(x.duracao_minutos || 0), 0);
  const valTotal = itens.reduce((s, x) => s + getPrecoFinalServico(x), 0);
  const label    = qtd === 1 ? counterSingular : counterPlural;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60]"
      style={{ background: 'rgba(10,10,10,0.97)', borderTop: '1px solid rgba(212,160,23,0.25)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black text-xs font-normal shrink-0"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {qtd}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-normal truncate">
              {qtd} {label} selecionado{qtd > 1 ? 's' : ''}
            </div>
            <div className="text-gray-500 text-xs font-normal">
              {durTotal} min &nbsp;·&nbsp; R$ {valTotal.toFixed(2)}
            </div>
          </div>
          <button onClick={onClear} className="text-gray-600 hover:text-gray-400 shrink-0 ml-1" title="Limpar seleção">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onConfirm}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-full text-sm font-normal uppercase whitespace-nowrap"
        >
          <Calendar className="w-4 h-4" />
          Escolher data
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ServicoButtons({ servico, profissional, selecaoProfId, servicosSelecionados, isProfessional, onAgendarAgora, onToggleSelecao }) {
  const isSelecionado = servicosSelecionados.some(x => x.id === servico.id);
  const modoSelecaoOn = servicosSelecionados.length > 0;
  const outroProfSel  = modoSelecaoOn && selecaoProfId !== null && selecaoProfId !== profissional.id;
  const agendarDesabilitado    = !!isProfessional || modoSelecaoOn;
  const selecionarDesabilitado = !!isProfessional || outroProfSel;

  let selecionarClass;
  if (isProfessional || outroProfSel) {
    selecionarClass = 'bg-vcard2 border-vborder text-vmuted cursor-not-allowed opacity-30';
  } else if (isSelecionado) {
    selecionarClass = 'bg-primary/15 border-primary text-primary';
  } else if (modoSelecaoOn) {
    selecionarClass = 'bg-vcard2 border-vborder text-white hover:border-primary hover:text-primary';
  } else {
    selecionarClass = 'bg-vcard2 border-vborder text-vsub hover:border-primary hover:text-primary';
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => !agendarDesabilitado && onAgendarAgora(profissional, [servico])}
        disabled={agendarDesabilitado}
        className={[
          'flex-1 py-2.5 rounded-button text-sm font-normal uppercase transition-all flex items-center justify-center gap-1.5',
          agendarDesabilitado
            ? 'bg-vcard2 border border-vborder text-vmuted cursor-not-allowed opacity-40'
            : 'bg-gradient-to-r from-primary to-yellow-600 text-black hover:opacity-90',
        ].join(' ')}
      >
        <Calendar className="w-3.5 h-3.5" />
        Agendar agora
      </button>
      <button
        onClick={() => !selecionarDesabilitado && onToggleSelecao(profissional, servico)}
        disabled={selecionarDesabilitado}
        className={[
          'flex-1 py-2.5 rounded-button text-sm font-normal uppercase transition-all flex items-center justify-center gap-1.5 border',
          selecionarClass,
        ].join(' ')}
      >
        {isSelecionado
          ? <><Check className="w-3.5 h-3.5" /> Selecionado</>
          : <><ShoppingBag className="w-3.5 h-3.5" /> Selecionar</>
        }
      </button>
    </div>
  );
}

function ServicosCarousel({ lista, profissional, selecaoProfId, servicosSelecionados, isProfessional, onAgendarAgora, onToggleSelecao, emptyMsg }) {
  const [pagina, setPagina] = useState(0);
  const touchStartX = useRef(null);
  const totalPaginas = Math.ceil(lista.length / SERVICOS_POR_PAGINA);
  const paginaAtual  = Math.min(pagina, Math.max(0, totalPaginas - 1));
  const itensPagina  = lista.slice(paginaAtual * SERVICOS_POR_PAGINA, paginaAtual * SERVICOS_POR_PAGINA + SERVICOS_POR_PAGINA);
  useEffect(() => { setPagina(0); }, [profissional.id]);
  const irPara = (idx) => setPagina(Math.max(0, Math.min(idx, totalPaginas - 1)));
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) irPara(paginaAtual + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };
  if (!lista.length) return <p className="text-vmuted font-normal">{emptyMsg}</p>;
  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex flex-col gap-3">
        {itensPagina.map(s => {
          const preco      = Number(s.preco ?? 0);
          const promo      = Number(s.preco_promocional ?? 0);
          const temPromo   = Number.isFinite(promo) && promo > 0 && promo < preco;
          const precoFinal = getPrecoFinalServico(s);
          return (
            <div key={s.id} className="bg-vcard2 border border-vborder rounded-custom p-4">
              {temPromo ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-normal text-sm leading-tight">{s.nome}</div>
                    <span className="inline-block px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded-button text-[9px] text-green-400 font-normal uppercase shrink-0">OFERTA</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-vmuted font-normal">
                      <Clock className="w-3 h-3 shrink-0" />{s.duracao_minutos} MIN
                    </div>
                    <div className="text-green-400 font-normal text-base shrink-0">R$ {precoFinal.toFixed(2)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-normal text-sm leading-tight">{s.nome}</div>
                    <div className="text-primary font-normal text-base shrink-0">R$ {precoFinal.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-vmuted font-normal">
                    <Clock className="w-3 h-3 shrink-0" />{s.duracao_minutos} MIN
                  </div>
                </>
              )}
              <ServicoButtons
                servico={s}
                profissional={profissional}
                selecaoProfId={selecaoProfId}
                servicosSelecionados={servicosSelecionados}
                isProfessional={isProfessional}
                onAgendarAgora={onAgendarAgora}
                onToggleSelecao={onToggleSelecao}
              />
            </div>
          );
        })}
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              onClick={() => irPara(i)}
              className={[
                'rounded-full transition-all',
                i === paginaAtual ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-gray-700 hover:bg-gray-500',
              ].join(' ')}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Vitrine({ user, userType }) {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const vitrineMsgs = ptBR?.vitrine || {};
  const getMsg      = (key, fallback) => vitrineMsgs?.[key] || fallback;
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
  const counterSingular = ptBR?.dashboard?.business?.counter_singular?.[businessGroup] ?? 'serviço';
  const counterPlural   = ptBR?.dashboard?.business?.counter_plural?.[businessGroup]   ?? 'serviços';
  const emptyListMsg    = ptBR?.dashboard?.business?.empty_list?.[businessGroup]       ?? 'Sem serviços para este profissional.';
  const [nativeAlertOpen,   setNativeAlertOpen]   = useState(false);
  const [nativeAlertData,   setNativeAlertData]   = useState({ title: '', body: '', buttonText: 'OK' });
  const [nativeConfirmOpen, setNativeConfirmOpen] = useState(false);
  const [nativeConfirmData, setNativeConfirmData] = useState({ title: '', body: '', confirmText: 'CONFIRMAR', cancelText: 'CANCELAR' });
  const confirmResolverRef = useRef(null);
  const alertAfterCloseRef = useRef(null);
  const closeAlert = () => {
    setNativeAlertOpen(false);
    const fn = alertAfterCloseRef.current;
    alertAfterCloseRef.current = null;
    if (typeof fn === 'function') fn();
  };
  const openAlert = ({ title, body, buttonText }) => {
    setNativeAlertData({ title: title || getMsg('generic_title', 'Aviso'), body: body || '', buttonText: buttonText || 'OK' });
    setNativeAlertOpen(true);
  };
  const alertKey = (key, fallbackTitle, fallbackBody, fallbackBtn = 'OK') => {
    const m = vitrineMsgs?.[key];
    if (m && typeof m === 'object') {
      openAlert({ title: m.title || fallbackTitle || getMsg('generic_title', 'Aviso'), body: m.body || fallbackBody || '', buttonText: m.buttonText || fallbackBtn || 'OK' });
      return;
    }
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
  const [isFavorito,   setIsFavorito]   = useState(false);
  const [calendarLink, setCalendarLink] = useState('');
  const [flow, setFlow] = useState({ step: 0, profissional: null, servicosSelecionados: [], lastSlot: null });
  const [selecaoProfId,        setSelecaoProfId]        = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const todayISO = useMemo(() => getNowSP().date, []);
  const [showDepoimento,           setShowDepoimento]           = useState(false);
  const [depoimentoNota,           setDepoimentoNota]           = useState(5);
  const [depoimentoTexto,          setDepoimentoTexto]          = useState('');
  const [depoimentoLoading,        setDepoimentoLoading]        = useState(false);
  const [depoimentoTipo,           setDepoimentoTipo]           = useState('negocio');
  const [depoimentoProfissionalId, setDepoimentoProfissionalId] = useState(null);
  const isProfessional = user && userType === 'professional';
  useEffect(() => { loadVitrine(); }, [slug]);
  useEffect(() => {
    if (user && negocio?.id) checkFavorito();
    else setIsFavorito(false);
  }, [user?.id, userType, negocio?.id]);

  const loadVitrine = async () => {
    setLoading(true); setError(null);
    const watchdog = setTimeout(() => { setLoading(false); setError(getMsg('load_timeout', 'Demorou demais para carregar. Tente novamente.')); }, 12000);
    try {
      const { data: negocioData, error: negocioError } = await withTimeout(supabase.from('negocios').select('*').eq('slug', slug).maybeSingle(), 7000, 'negocio');
      if (negocioError) throw negocioError;
      if (!negocioData) { setNegocio(null); setProfissionais([]); setEntregas([]); setDepoimentos([]); setGaleriaItems([]); return; }
      setNegocio(negocioData);
      const { data: profissionaisData, error: profErr } = await withTimeout(supabase.from('profissionais').select('*').eq('negocio_id', negocioData.id), 7000, 'profissionais');
      if (profErr) throw profErr;
      const profs = profissionaisData || [];
      setProfissionais(profs);
      const profissionalIds = profs.map(p => p.id).filter(Boolean);
      const depFilter = profissionalIds.length ? `negocio_id.eq.${negocioData.id},profissional_id.in.(${profissionalIds.join(',')})` : `negocio_id.eq.${negocioData.id}`;
      const [entregasResult, galeriaResult, depoimentosResult] = await Promise.all([
        profissionalIds.length ? withTimeout(supabase.from('entregas').select('*').in('profissional_id', profissionalIds).eq('ativo', true), 7000, 'entregas') : Promise.resolve({ data: [], error: null }),
        withTimeout(supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocioData.id).order('ordem', { ascending: true }).order('created_at', { ascending: true }), 7000, 'galerias'),
        withTimeout(supabase.from('depoimentos').select('id, tipo, negocio_id, profissional_id, cliente_id, nota, comentario, created_at').or(depFilter).order('created_at', { ascending: false }).limit(20), 7000, 'depoimentos'),
      ]);
      if (entregasResult.error) throw entregasResult.error;
      if (galeriaResult.error) throw galeriaResult.error;
      if (depoimentosResult.error) throw depoimentosResult.error;
      setEntregas(entregasResult.data || []);
      setGaleriaItems(galeriaResult.data || []);
      const base = depoimentosResult.data || [];
      const clienteIds = Array.from(new Set(base.map(a => a.cliente_id).filter(Boolean)));
      let usersMap = new Map();
      if (clienteIds.length) {
        const { data: usersDb, error: upErr } = await withTimeout(supabase.from('users').select('id, nome, avatar_path, type').in('id', clienteIds), 7000, 'users');
        if (upErr) throw upErr;
        usersMap = new Map((usersDb || []).map(u => [u.id, u]));
      }
      const profMap = new Map((profs || []).map(p => [p.id, p]));
      const negociosNome = negocioData?.nome || null;
      setDepoimentos(base.map(a => {
        const u = usersMap.get(a.cliente_id) || null;
        const p = profMap.get(a.profissional_id) || null;
        return { ...a, users: u ? { nome: u.nome, avatar_path: u.avatar_path, type: u.type } : null, profissionais: p ? { nome: p.nome } : null, negocios: { nome: negociosNome } };
      }));
    } catch (e) {
      setError(e?.message || getMsg('load_error', 'Erro ao carregar a vitrine.'));
      setNegocio(null); setProfissionais([]); setEntregas([]); setDepoimentos([]); setGaleriaItems([]);
    } finally { clearTimeout(watchdog); setLoading(false); }
  };

  const checkFavorito = async () => {
    if (!user || userType !== 'client' || !negocio?.id) { setIsFavorito(false); return; }
    try {
      const { data, error: favErr } = await withTimeout(supabase.from('favoritos').select('id').eq('cliente_id', user.id).eq('tipo', 'negocio').eq('negocio_id', negocio.id).maybeSingle(), 6000, 'favorito');
      if (favErr) throw favErr;
      setIsFavorito(!!data);
    } catch { setIsFavorito(false); }
  };

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
    return true;
  };

  const handleAgendarAgora = async (profissional, servicos) => {
    if (!(await requireLogin())) return;
    setSelecaoProfId(null); setServicosSelecionados([]); setCalendarLink('');
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
    setFlow({ step: 'booking', profissional, servicosSelecionados, lastSlot: null });
    setSelecaoProfId(null); setServicosSelecionados([]);
  };

  const handleLimparSelecao = () => { setSelecaoProfId(null); setServicosSelecionados([]); };

  const entregaVirtual = useMemo(() => {
    if (!flow.servicosSelecionados?.length) return null;
    const primeiroServico = flow.servicosSelecionados[0];
    const durTotal = flow.servicosSelecionados.reduce((sum, s) => sum + Number(s?.duracao_minutos || 0), 0);
    const valTotal = flow.servicosSelecionados.reduce((sum, s) => sum + getPrecoFinalServico(s), 0);
    return { id: primeiroServico.id, nome: flow.servicosSelecionados.length === 1 ? primeiroServico.nome : `${flow.servicosSelecionados.length} ${counterPlural}`, duracao_minutos: durTotal, preco: valTotal, preco_promocional: null };
  }, [flow.servicosSelecionados, counterPlural]);

  const handleBookingConfirm = (slot) => {
    const primeiroServico = flow.servicosSelecionados?.[0];
    const durTotal = (flow.servicosSelecionados || []).reduce((sum, s) => sum + Number(s?.duracao_minutos || 0), 0);
    const link = gerarLinkGoogle(primeiroServico?.nome || 'Agendamento', slot.inicio, durTotal);
    if (window.OneSignalDeferred) { window.OneSignalDeferred.push(async function (OneSignal) { await OneSignal.sendTags({ ultima_acao: 'agendamento_realizado', servico_nome: primeiroServico?.nome || 'Serviço', data_agendamento: slot.dataISO, horario_agendamento: slot.label }); }); }
    setCalendarLink(link);
    setFlow(prev => ({ ...prev, step: 5, lastSlot: slot }));
  };

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
      await loadVitrine();
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
    const now = getNowSP();
    const a = timeToMinutes(ini), b = timeToMinutes(fim);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (b < a) return (now.minutes >= a || now.minutes < b);
    return (now.minutes >= a && now.minutes < b);
  };
  const getProfStatus = (p) => {
    const ativo = (p?.ativo === undefined) ? true : !!p.ativo;
    if (!ativo) return { label: 'FECHADO', color: 'bg-red-500' };
    const now = getNowSP();
    const ini = timeToMinutes(p?.horario_inicio || '08:00');
    const fim = timeToMinutes(p?.horario_fim    || '18:00');
    const dias = normalizeDiasTrabalho(p?.dias_trabalho);
    const diasEfetivos = dias.length ? dias : [0, 1, 2, 3, 4, 5, 6];
    const hojeDow = getDowFromDateSP(now.date);
    const trabalhaHoje = hojeDow == null ? true : diasEfetivos.includes(hojeDow);
    const dentroHorario = now.minutes >= ini && now.minutes < fim;
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
    for (const [profId, deps] of map.entries()) { const media = deps.length > 0 ? (deps.reduce((sum, d) => sum + d.nota, 0) / deps.length).toFixed(1) : null; medias.set(profId, { media, count: deps.length }); }
    return medias;
  }, [depoimentos]);

  if (loading) return (<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-primary text-2xl font-normal animate-pulse">CARREGANDO...</div></div>);
  if (error) return (<div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="max-w-md w-full bg-dark-100 border border-red-500/40 rounded-custom p-8 text-center"><AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" /><h1 className="text-2xl font-normal text-white mb-2">Houve um erro ao carregar</h1><p className="text-gray-400 mb-6">{error}</p><button onClick={loadVitrine} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button font-normal uppercase">Tentar novamente</button></div></div>);
  if (!negocio) return (<div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="text-center"><h1 className="text-3xl font-normal text-white mb-4">Negócio inexistente.</h1><Link to="/" className="text-primary hover:text-yellow-500 font-normal">Voltar para Home</Link></div></div>);

  const mediaDepoimentos = depoimentos.length > 0 ? (depoimentos.reduce((sum, d) => sum + d.nota, 0) / depoimentos.length).toFixed(1) : '0.0';
  const nomeNegocioLabel = String(negocio?.nome || '').trim() || 'NEGÓCIO';
  const temaAtivo = negocio?.tema || 'dark';
  const hasSelecao = servicosSelecionados.length > 0;

  return (
    <div className={`min-h-screen bg-vbg text-vtext${temaAtivo === 'light' ? ' vitrine-light' : ''}`} style={hasSelecao ? { paddingBottom: 72 } : undefined}>
      <AlertModal  open={nativeAlertOpen}   onClose={closeAlert}                title={nativeAlertData.title}   body={nativeAlertData.body}   buttonText={nativeAlertData.buttonText} />
      <ConfirmModal open={nativeConfirmOpen} onCancel={() => closeConfirm(false)} onConfirm={() => closeConfirm(true)} title={nativeConfirmData.title} body={nativeConfirmData.body} confirmText={nativeConfirmData.confirmText} cancelText={nativeConfirmData.cancelText} />

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
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-vsub hover:text-primary transition-colors uppercase"><ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">Voltar</span></button>
            <div className="flex items-center gap-2">
              <button onClick={abrirDepoimento} disabled={!!isProfessional} className={`flex items-center gap-2 h-9 px-5 rounded-button transition-all bg-vcard2 border uppercase focus:outline-none focus:ring-0 focus:ring-offset-0 ${isProfessional ? 'border-vborder2 text-vmuted cursor-not-allowed' : 'border-vborder text-vsub hover:border-primary'}`}><StarChar size={18} className="text-primary" /><span className="hidden sm:inline">Depoimento</span></button>
              <button onClick={toggleFavorito} disabled={!!isProfessional} className={`h-9 flex items-center gap-2 px-5 rounded-button transition-all uppercase border focus:outline-none focus:ring-0 focus:ring-offset-0 ${isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : isFavorito ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-vcard2 border-vborder text-vsub hover:text-red-400'}`}><HeartIcon filled={isFavorito} size={20} className={isFavorito ? 'text-red-500' : 'text-vsub'} /><span className="hidden sm:inline">{isProfessional ? 'Somente Cliente' : (isFavorito ? 'Favoritado' : 'Favoritar')}</span></button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative bg-gradient-to-br from-primary/20 via-vbg to-yellow-600/20 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {logoUrl ? (<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-primary/30 bg-vcard"><img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /></div>) : (<div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center text-4xl sm:text-5xl font-normal text-black">{negocio.nome?.[0] || 'N'}</div>)}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal mb-3">{negocio.nome}</h1>
              <p className="text-base sm:text-lg text-vsub mb-4 font-normal">{negocio.descricao}</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2"><StarChar size={18} className="text-primary" /><span className="text-xl font-normal text-primary">{mediaDepoimentos}</span></div>
                {negocio.endereco && (<div className="flex items-center gap-2 text-vsub text-sm"><MapPin className="w-4 h-4" strokeWidth={1.5} /><span className="font-normal">{negocio.endereco}</span></div>)}
                {negocio.telefone && (<a href={`tel:${sanitizeTel(negocio.telefone) || negocio.telefone}`} className="flex items-center gap-2 text-primary hover:text-yellow-500 text-sm font-normal transition-colors"><Phone className="w-4 h-4" strokeWidth={1.5} />{negocio.telefone}</a>)}
                {instagramUrl && (<a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:text-yellow-500 text-sm font-normal transition-colors" aria-label="Instagram"><Instagram className="w-4 h-4" strokeWidth={1.5} />clique :)</a>)}
                {facebookUrl && (<a href={facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:text-yellow-500 text-sm font-normal transition-colors" aria-label="Facebook"><FacebookIcon className="w-4 h-4" />clique :)</a>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Profissionais — masonry + chips ── */}
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
                <div key={prof.id} className="mb-6 break-inside-avoid bg-vcard border border-vborder rounded-custom p-6 hover:border-primary/50 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    {avatarUrl ? (
                      <div className="w-14 h-14 rounded-custom overflow-hidden border border-vborder bg-vcard2 shrink-0"><img src={avatarUrl} alt={prof.nome} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center text-2xl font-normal text-black shrink-0">{prof.nome?.[0] || 'P'}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-lg font-normal">{prof.nome}</h3>
                        {profissao && (<span className="inline-block px-2 py-1 bg-primary/20 border border-primary/30 rounded-button text-[10px] text-primary font-normal uppercase whitespace-nowrap shrink-0">{profissao}</span>)}
                      </div>
                      {depInfo?.media && (
                        <div className="flex items-center gap-2 mb-1">
                          <StarChar size={16} className="text-primary" />
                          <span className="text-lg font-normal text-primary">{depInfo.media}</span>
                          <span className="text-xs text-vmuted">({depInfo.count})</span>
                        </div>
                      )}
                      {prof.anos_experiencia != null && (<p className="text-sm text-vmuted font-normal">{prof.anos_experiencia} ano(s) de experiência</p>)}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.color}`} />
                        <span className="text-xs text-vsub font-normal uppercase">{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">
                      {horarioIni} – {horarioFim}
                    </span>
                    {almIni && almFim && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">
                        Almoço {String(almIni).slice(0, 5)} – {String(almFim).slice(0, 5)}
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-vcard2 border border-vborder text-xs text-vsub font-normal">
                      {totalEntregas} {totalEntregas === 1 ? counterSingular : counterPlural}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-normal mb-6">{sectionTitle}</h2>
        </div>
        {profissionais.length === 0 ? (
          <p className="text-vmuted font-normal px-4 sm:px-6 lg:px-8">Nenhum profissional cadastrado.</p>
        ) : (
          <div className="space-y-px">
            {profissionais.map(p => {
              const lista = (entregasPorProf.get(p.id) || []).slice().sort((a, b) => { const pa = Number(getPrecoFinalServico(a) ?? 0); const pb = Number(getPrecoFinalServico(b) ?? 0); if (pb !== pa) return pb - pa; return String(a.nome || '').localeCompare(String(b.nome || '')); });
              return (
                <div key={p.id} className="bg-vcard border-t border-b border-vborder w-full px-4 sm:px-6 lg:px-8 py-6">
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-normal text-lg">{p.nome}</div>
                      <div className="text-xs text-vmuted font-normal">{lista.length} {lista.length === 1 ? counterSingular : counterPlural}</div>
                    </div>
                    <ServicosCarousel lista={lista} profissional={p} selecaoProfId={selecaoProfId} servicosSelecionados={servicosSelecionados} isProfessional={isProfessional} onAgendarAgora={handleAgendarAgora} onToggleSelecao={handleToggleSelecao} emptyMsg={emptyListMsg} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {galeriaItems.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {galeriaItems.map((item) => { const url = getPublicUrl('galerias', item.path); if (!url) return null; return (<div key={item.id} className="mb-3 w-full break-inside-avoid overflow-hidden rounded-custom border border-vborder bg-vcard"><img src={url} alt="Galeria" className="w-full h-auto object-contain bg-vbg" loading="lazy" /></div>); })}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-normal">Depoimentos</h2>
            <button onClick={abrirDepoimento} disabled={!!isProfessional} className={`px-5 py-2 border rounded-button text-sm transition-all uppercase font-normal ${isProfessional ? 'bg-vcard border-vborder2 text-vmuted cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'}`}>+ Depoimento</button>
          </div>
          {depoimentos.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
              {depoimentos.map(dep => {
                const avatarClienteUrl = getPublicUrl('avatars', dep.users?.avatar_path);
                return (
                  <div key={dep.id} className="mb-4 break-inside-avoid bg-vcard border border-vborder rounded-custom p-4 relative">
                    <div className="absolute top-3 right-3">
                      {dep.profissional_id && dep.profissionais?.nome ? (<span className="inline-block px-1.5 py-0.5 bg-primary/20 border border-primary/30 rounded-button text-[10px] text-primary font-normal uppercase">{dep.profissionais.nome}</span>) : (<span className="inline-block px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-button text-[10px] text-blue-400 font-normal uppercase">{nomeNegocioLabel}</span>)}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {avatarClienteUrl ? (<div className="w-10 h-10 rounded-full overflow-hidden border border-vborder bg-vcard2 shrink-0"><img src={avatarClienteUrl} alt={dep.users?.nome} className="w-full h-full object-cover" /></div>) : (<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-normal shrink-0">{dep.users?.nome?.[0] || 'A'}</div>)}
                      <div className="flex-1"><p className="text-sm font-normal">{dep.users?.nome || 'Cliente'}</p><Stars5Char value={dep.nota} size={14} /></div>
                    </div>
                    {dep.comentario && <p className="text-sm text-vsub font-normal">{dep.comentario}</p>}
                  </div>
                );
              })}
            </div>
          ) : <p className="text-vmuted font-normal">Nenhum depoimento ainda</p>}
        </div>
      </section>

      <SelectionBar itens={servicosSelecionados} counterSingular={counterSingular} counterPlural={counterPlural} onConfirm={handleConfirmarSelecao} onClear={handleLimparSelecao} />

      {flow.step === 'booking' && entregaVirtual && (<BookingCalendar profissional={flow.profissional} entrega={entregaVirtual} todayISO={todayISO} negocioId={negocio.id} clienteId={user?.id} onConfirm={handleBookingConfirm} onClose={() => setFlow(prev => ({ ...prev, step: 0 }))} />)}

      {flow.step === 5 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-10 h-10 text-green-400" /></div>
              <h3 className="text-2xl font-normal mb-2 text-white">AGENDADO!</h3>
              <p className="text-gray-400 font-normal mb-1">{flow.lastSlot?.label && <span className="text-primary font-normal">{flow.lastSlot.label}</span>}{flow.lastSlot?.dataISO && <span className="text-gray-400"> — {formatDateBR(flow.lastSlot.dataISO)}</span>}</p>
              <p className="text-gray-500 font-normal text-sm mb-6">Salve um lembrete no seu celular para não esquecer.</p>
              <a href={calendarLink} target="_blank" rel="noreferrer" className="block w-full py-4 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal mb-3">ADICIONAR À MINHA AGENDA</a>
              <button onClick={() => { setFlow(prev => ({ ...prev, step: 0 })); navigate('/minha-area'); }} className="w-full py-3 bg-transparent border border-red-500 text-red-500 rounded-button uppercase font-normal hover:bg-red-500/10 transition-colors">PREFIRO ESQUECER</button>
            </div>
          </div>
        </div>
      )}

      {showDepoimento && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 shrink-0">
              <h3 className="text-2xl font-normal text-white">DEPOIMENTO</h3>
              <button onClick={() => setShowDepoimento(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 flex-1">
              <div className="mb-4">
                <div className="text-sm text-gray-300 font-normal mb-2">Você está deixando um depoimento sobre</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setDepoimentoTipo('negocio'); setDepoimentoProfissionalId(null); }} className={`px-4 py-3 rounded-custom border transition-all font-normal ${depoimentoTipo === 'negocio' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-dark-200 border-gray-800 text-gray-400'}`}>{nomeNegocioLabel}</button>
                  <button onClick={() => setDepoimentoTipo('profissional')} className={`px-4 py-3 rounded-custom border transition-all font-normal ${depoimentoTipo === 'profissional' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-400'}`}>PROFISSIONAL</button>
                </div>
              </div>
              {depoimentoTipo === 'profissional' && (
                <div className="mb-4">
                  <div className="text-sm text-gray-300 font-normal mb-2">Qual profissional?</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {profissionais.map(prof => (<button key={prof.id} onClick={() => setDepoimentoProfissionalId(prof.id)} className={`w-full text-left px-4 py-3 rounded-custom border transition-all font-normal ${depoimentoProfissionalId === prof.id ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-400 hover:border-primary/30'}`}>{prof.nome}</button>))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <div className="text-sm text-gray-300 font-normal mb-2">Nota</div>
                <div className="flex gap-2">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setDepoimentoNota(n)} className={`w-12 h-8 rounded-button border transition-all font-normal ${depoimentoNota >= n ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-500'}`}>{n}</button>))}</div>
              </div>
              <div className="mb-5">
                <div className="text-sm text-gray-300 font-normal mb-2">Comentário é opcional</div>
                <textarea value={depoimentoTexto} onChange={(e) => setDepoimentoTexto(e.target.value)} rows={4} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none" placeholder="Conte como foi sua experiência..." />
              </div>
              <button onClick={enviarDepoimento} disabled={depoimentoLoading || (depoimentoTipo === 'profissional' && !depoimentoProfissionalId)} className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button disabled:opacity-60 uppercase font-normal">{depoimentoLoading ? 'ENVIANDO...' : 'ENVIAR DEPOIMENTO'}</button>
              <p className="text-xs text-gray-500 mt-3 font-normal">{depoimentoTipo === 'profissional' && !depoimentoProfissionalId ? 'Selecione um profissional para continuar' : 'Somente clientes logados podem deixar depoimentos.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
