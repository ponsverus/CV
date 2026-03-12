import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Phone,
  Heart,
  ArrowLeft,
  Zap,
  X,
  AlertCircle,
  Instagram,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../supabase';
import { ptBR } from '../feedback/messages/ptBR';
import { getBusinessGroup } from '../businessTerms';

const FOLGA_MINUTOS = 5;

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

function getNowSP() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const get = (type) => parts.find(p => p.type === type)?.value;
  const y = get('year');
  const mo = get('month');
  const d = get('day');
  const hh = get('hour');
  const mm = get('minute');

  return {
    date: `${y}-${mo}-${d}`,
    minutes: (Number(hh) * 60) + Number(mm)
  };
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
    timeZone: 'America/Sao_Paulo',
    weekday: 'short'
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
  } catch {
    return null;
  }
}

function gerarLinkGoogle(titulo, dataInicioISO, duracaoMin) {
  const fmt = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const inicio = new Date(dataInicioISO);
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${fmt(inicio)}/${fmt(fim)}&details=Agendamento+confirmado+pelo+Comvaga&sf=true&output=xml`;
}

function FacebookIcon({ className = '', size = 16 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}


  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
      ★
    </span>
  );
}

function Stars5Char({ value = 0, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${v} de 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          style={{ fontSize: size, lineHeight: 1 }}
          className={i <= v ? 'text-primary' : 'text-gray-700'}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

function normalizeDiasTrabalho(arr) {
  const base = Array.isArray(arr) ? arr : [];
  const cleaned = base
    .map(n => Number(n))
    .filter(n => Number.isFinite(n))
    .map(n => (n === 7 ? 0 : n))
    .filter(n => n >= 0 && n <= 6);
  return Array.from(new Set(cleaned)).sort((a, b) => a - b);
}

function resolveInstagram(instaRaw) {
  const raw = String(instaRaw || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const handle = raw.replace(/^@/, '').replace(/\s+/g, '');
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

function resolveFacebook(fbRaw) {
  const raw = String(fbRaw || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const handle = raw.replace(/^@/, '').replace(/\s+/g, '');
  if (!handle) return null;
  return `https://facebook.com/${handle}`;
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

function DatePickerButton({ value, onChange, min, placeholder = 'SELECIONAR DATA', className = '' }) {
  const label = value ? formatDateBR(value) : placeholder;
  const inputRef = useRef(null);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker?.();
      inputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={handleClick}
        className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white flex items-center justify-between uppercase cursor-pointer select-none hover:border-primary/50 transition-colors"
      >
        <span className={`text-base pointer-events-none ${value ? 'text-white' : 'text-gray-400'}`}>{label}</span>
        <span className="sm:hidden w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 pointer-events-none" />
        <span className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-700 bg-dark-100/60 shrink-0 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-300" />
        </span>
      </div>
      <input
        ref={inputRef}
        type="date"
        min={min}
        value={value}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        aria-label="Selecionar data"
        tabIndex={-1}
      />
    </div>
  );
}

function AlertModal({ open, onClose, title, body, buttonText }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-6">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="text-xl font-normal text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {body && <p className="text-gray-300 font-normal whitespace-pre-line">{body}</p>}
        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal"
        >
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
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {body && <p className="text-gray-300 font-normal whitespace-pre-line">{body}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-dark-200 border border-gray-800 rounded-button uppercase font-normal text-gray-200"
          >
            {cancelText || 'CANCELAR'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal"
          >
            {confirmText || 'CONFIRMAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vitrine({ user, userType }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const vitrineMsgs = ptBR?.vitrine || {};
  const getMsg = (key, fallback) => vitrineMsgs?.[key] || fallback;

  const [negocio, setNegocio] = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [galeriaItems, setGaleriaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const businessGroup = useMemo(
    () => getBusinessGroup(negocio?.tipo_negocio),
    [negocio?.tipo_negocio]
  );

  const bizV = vitrineMsgs?.business || {};
  const sectionTitle    = bizV?.section_title?.[businessGroup]  ?? 'Atendimentos';
  const btnAgendarLabel = bizV?.label_button?.[businessGroup]   ?? 'AGENDAR ATENDIMENTO';
  const counterSingular = ptBR?.dashboard?.business?.counter_singular?.[businessGroup] ?? 'atendimento';
  const counterPlural   = ptBR?.dashboard?.business?.counter_plural?.[businessGroup]   ?? 'atendimentos';
  const emptyListMsg    = ptBR?.dashboard?.business?.empty_list?.[businessGroup]       ?? 'Sem atendimentos para este profissional.';

  const [nativeAlertOpen, setNativeAlertOpen] = useState(false);
  const [nativeAlertData, setNativeAlertData] = useState({ title: '', body: '', buttonText: 'OK' });
  const [nativeConfirmOpen, setNativeConfirmOpen] = useState(false);
  const [nativeConfirmData, setNativeConfirmData] = useState({
    title: '', body: '', confirmText: 'CONFIRMAR', cancelText: 'CANCELAR'
  });
  const confirmResolverRef = useRef(null);
  const alertAfterCloseRef = useRef(null);

  const closeAlert = () => {
    setNativeAlertOpen(false);
    const fn = alertAfterCloseRef.current;
    alertAfterCloseRef.current = null;
    if (typeof fn === 'function') fn();
  };

  const openAlert = ({ title, body, buttonText }) => {
    setNativeAlertData({
      title: title || getMsg('generic_title', 'Aviso'),
      body: body || '',
      buttonText: buttonText || 'OK'
    });
    setNativeAlertOpen(true);
  };

  const alertKey = (key, fallbackTitle, fallbackBody, fallbackBtn = 'OK') => {
    const m = vitrineMsgs?.[key];
    if (m && typeof m === 'object') {
      openAlert({
        title: m.title || fallbackTitle || getMsg('generic_title', 'Aviso'),
        body: m.body || fallbackBody || '',
        buttonText: m.buttonText || fallbackBtn || 'OK'
      });
      return;
    }
    openAlert({ title: fallbackTitle || getMsg('generic_title', 'Aviso'), body: fallbackBody || '', buttonText: fallbackBtn || 'OK' });
  };

  const confirmKey = (key, fallbackTitle, fallbackBody, fallbackConfirm = 'CONFIRMAR', fallbackCancel = 'CANCELAR') => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      const m = vitrineMsgs?.[key];
      setNativeConfirmData({
        title: (m && m.title) ? m.title : (fallbackTitle || getMsg('generic_title', 'Confirmar')),
        body: (m && m.body) ? m.body : (fallbackBody || ''),
        confirmText: (m && m.confirmText) ? m.confirmText : fallbackConfirm,
        cancelText: (m && m.cancelText) ? m.cancelText : fallbackCancel
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
  const [showAgendamento, setShowAgendamento] = useState(false);
  const [calendarLink, setCalendarLink] = useState('');
  const [flow, setFlow] = useState({
    step: 1, profissional: null, data: '', horario: null, servicosSelecionados: []
  });

  const minDateSP = useMemo(() => getNowSP().date, []);

  const [showAvaliar, setShowAvaliar] = useState(false);
  const [avaliarNota, setAvaliarNota] = useState(5);
  const [avaliarTexto, setAvaliarTexto] = useState('');
  const [avaliarLoading, setAvaliarLoading] = useState(false);
  const [avaliarTipo, setAvaliarTipo] = useState('negocio');
  const [avaliarProfissionalId, setAvaliarProfissionalId] = useState(null);

  const isProfessional = user && userType === 'professional';
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { loadVitrine(); }, [slug]);

  useEffect(() => {
    if (user && negocio?.id) checkFavorito();
    else setIsFavorito(false);
  }, [user?.id, userType, negocio?.id]);

  const loadVitrine = async () => {
    setLoading(true);
    setError(null);

    const watchdog = setTimeout(() => {
      setLoading(false);
      setError(getMsg('load_timeout', 'Demorou demais para carregar. Tente novamente.'));
    }, 12000);

    try {
      const { data: negocioData, error: negocioError } = await withTimeout(
        supabase.from('negocios').select('*').eq('slug', slug).maybeSingle(), 7000, 'negocio'
      );
      if (negocioError) throw negocioError;
      if (!negocioData) {
        setNegocio(null); setProfissionais([]); setEntregas([]); setAvaliacoes([]); setGaleriaItems([]);
        return;
      }
      setNegocio(negocioData);

      const { data: profissionaisData, error: profErr } = await withTimeout(
        supabase.from('profissionais').select('*').eq('negocio_id', negocioData.id), 7000, 'profissionais'
      );
      if (profErr) throw profErr;

      const profs = profissionaisData || [];
      setProfissionais(profs);
      const profissionalIds = profs.map(p => p.id).filter(Boolean);

      const avalFilter = profissionalIds.length
        ? `negocio_id.eq.${negocioData.id},profissional_id.in.(${profissionalIds.join(',')})`
        : `negocio_id.eq.${negocioData.id}`;

      const [entregasResult, galeriaResult, avaliacoesResult] = await Promise.all([
        profissionalIds.length
          ? withTimeout(supabase.from('entregas').select('*').in('profissional_id', profissionalIds).eq('ativo', true), 7000, 'entregas')
          : Promise.resolve({ data: [], error: null }),
        withTimeout(supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocioData.id).order('ordem', { ascending: true }).order('created_at', { ascending: true }), 7000, 'galerias'),
        withTimeout(supabase.from('avaliacoes').select('id, tipo, negocio_id, profissional_id, cliente_id, nota, comentario, created_at').or(avalFilter).order('created_at', { ascending: false }).limit(20), 7000, 'avaliacoes')
      ]);

      if (entregasResult.error) throw entregasResult.error;
      if (galeriaResult.error) throw galeriaResult.error;
      if (avaliacoesResult.error) throw avaliacoesResult.error;

      setEntregas(entregasResult.data || []);
      setGaleriaItems(galeriaResult.data || []);

      const base = avaliacoesResult.data || [];
      const clienteIds = Array.from(new Set(base.map(a => a.cliente_id).filter(Boolean)));
      let usersMap = new Map();

      if (clienteIds.length) {
        const { data: usersDb, error: upErr } = await withTimeout(
          supabase.from('users').select('id, nome, avatar_path, type').in('id', clienteIds), 7000, 'users'
        );
        if (upErr) throw upErr;
        usersMap = new Map((usersDb || []).map(u => [u.id, u]));
      }

      const profMap = new Map((profs || []).map(p => [p.id, p]));
      const negociosNome = negocioData?.nome || null;

      const finalAval = base.map(a => {
        const u = usersMap.get(a.cliente_id) || null;
        const p = profMap.get(a.profissional_id) || null;
        return {
          ...a,
          users: u ? { nome: u.nome, avatar_path: u.avatar_path, type: u.type } : null,
          profissionais: p ? { nome: p.nome } : null,
          negocios: { nome: negociosNome }
        };
      });

      setAvaliacoes(finalAval);
    } catch (e) {
      setError(e?.message || getMsg('load_error', 'Erro ao carregar a vitrine.'));
      setNegocio(null); setProfissionais([]); setEntregas([]); setAvaliacoes([]); setGaleriaItems([]);
    } finally {
      clearTimeout(watchdog);
      setLoading(false);
    }
  };

  const checkFavorito = async () => {
    if (!user || userType !== 'client' || !negocio?.id) { setIsFavorito(false); return; }
    try {
      const { data, error: favErr } = await withTimeout(
        supabase.from('favoritos').select('id').eq('cliente_id', user.id).eq('tipo', 'negocio').eq('negocio_id', negocio.id).maybeSingle(), 6000, 'favorito'
      );
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

  const iniciarAgendamento = async (profissional) => {
    if (!user) {
      const ok = await confirmKey('schedule_need_login_confirm', 'Login necessário', 'Você precisa fazer login para agendar. Deseja fazer login agora?', 'IR PARA LOGIN', 'MAIS TARDE');
      if (ok) navigate('/login');
      return;
    }
    if (userType !== 'client') {
      alertKey('schedule_only_client', 'Ação restrita', 'Você está logado como PROFISSIONAL. Para agendar, entre como CLIENTE.', 'ENTENDI');
      return;
    }
    setCalendarLink('');
    setFlow({ step: 1, profissional, data: '', horario: null, servicosSelecionados: [] });
    setShowAgendamento(true);
  };

  const entregasDoProf = useMemo(() => {
    if (!flow.profissional) return [];
    return entregas.filter(s => s.profissional_id === flow.profissional.id);
  }, [entregas, flow.profissional]);

  const [horariosAll, setHorariosAll] = useState([]);
  const [horariosHot, setHorariosHot] = useState([]);
  const [showAllSlots, setShowAllSlots] = useState(false);

  const diaSelecionadoEhTrabalho = useMemo(() => {
    if (!flow.profissional || !flow.data) return true;
    const dias = normalizeDiasTrabalho(flow.profissional.dias_trabalho);
    const diasEfetivos = dias.length ? dias : [0, 1, 2, 3, 4, 5, 6];
    const dow = getDowFromDateSP(flow.data);
    if (dow == null) return true;
    return diasEfetivos.includes(dow);
  }, [flow.profissional, flow.data]);

  const totalSelecionado = useMemo(() => {
    const lista = Array.isArray(flow.servicosSelecionados) ? flow.servicosSelecionados : [];
    const dur = lista.reduce((sum, s) => sum + Number(s?.duracao_minutos || 0), 0);
    const val = lista.reduce((sum, s) => sum + getPrecoFinalServico(s), 0);
    return { duracao: dur, valor: val, qtd: lista.length };
  }, [flow.servicosSelecionados]);

  const duracaoTotalComFolga = useMemo(() => {
    const dur = Number(totalSelecionado.duracao || 0);
    if (!dur || dur <= 0) return 0;
    return dur + FOLGA_MINUTOS;
  }, [totalSelecionado.duracao]);

  const entregasPossiveis = useMemo(() => {
    return (entregasDoProf || [])
      .filter(s => Number(s.duracao_minutos || 0) > 0)
      .sort((a, b) => {
        const pa = Number(getPrecoFinalServico(a) ?? 0);
        const pb = Number(getPrecoFinalServico(b) ?? 0);
        if (pb !== pa) return pb - pa;
        return String(a.nome || '').localeCompare(String(b.nome || ''));
      });
  }, [entregasDoProf]);

  const getAlmocoRange = (p) => ({ ini: p?.almoco_inicio || null, fim: p?.almoco_fim || null });

  const isInLunchNow = (p) => {
    const { ini, fim } = getAlmocoRange(p);
    if (!ini || !fim) return false;
    const now = getNowSP();
    const a = timeToMinutes(ini);
    const b = timeToMinutes(fim);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (b < a) return (now.minutes >= a || now.minutes < b);
    return (now.minutes >= a && now.minutes < b);
  };

  const getProfStatus = (p) => {
    const ativo = (p?.ativo === undefined) ? true : !!p.ativo;
    if (!ativo) return { label: 'FECHADO', color: 'bg-red-500' };
    const now = getNowSP();
    const ini = timeToMinutes(p?.horario_inicio || '08:00');
    const fim = timeToMinutes(p?.horario_fim || '18:00');
    const dias = normalizeDiasTrabalho(p?.dias_trabalho);
    const diasEfetivos = dias.length ? dias : [0, 1, 2, 3, 4, 5, 6];
    const hojeDow = getDowFromDateSP(now.date);
    const trabalhaHoje = hojeDow == null ? true : diasEfetivos.includes(hojeDow);
    const dentroHorario = now.minutes >= ini && now.minutes < fim;
    if (!(trabalhaHoje && dentroHorario)) return { label: 'FECHADO', color: 'bg-red-500' };
    if (isInLunchNow(p)) return { label: 'ALMOÇO', color: 'bg-yellow-400' };
    return { label: 'ABERTO', color: 'bg-green-500' };
  };

  const carregarSlotsBanco = async () => {
    if (!flow.profissional || !flow.data) return;
    if (!diaSelecionadoEhTrabalho) { setHorariosAll([]); setHorariosHot([]); setShowAllSlots(false); return; }
    const durServicos = Number(totalSelecionado.duracao || 0);
    if (!durServicos || durServicos <= 0) { setHorariosAll([]); setHorariosHot([]); setShowAllSlots(false); return; }
    const precisaMinutos = durServicos + FOLGA_MINUTOS;
    try {
      const { data: slotsV4, error: errV4 } = await withTimeout(
        supabase.rpc('rpc_get_slots_v4', {
          p_profissional_id: flow.profissional.id,
          p_dia: flow.data,
          p_entrega_min: durServicos,
          p_folga_min: 5,
          p_margem_min: 5,
          p_modo: 'todos'
        }), 9000, 'rpc-slots-v4'
      );
      if (errV4) throw errV4;
      const list = (slotsV4 || []).map(s => {
        const label = String(s.label || '').slice(0, 5);
        return { hora: label, tipo: 'normal', cabe: true, maxMinutos: precisaMinutos, precisaMinutos, motivo: null, isHeat: !!s.is_heat, isRaio: !!s.is_raio, inicio: s.inicio || null, fim: s.fim || null };
      });
      const uniq = new Map();
      const rank = (h) => (h?.isRaio ? 3 : h?.isHeat ? 2 : 1);
      for (const h of list) {
        if (!h.hora) continue;
        const key = h.hora;
        if (!uniq.has(key)) { uniq.set(key, h); continue; }
        const prev = uniq.get(key);
        if (rank(h) > rank(prev)) uniq.set(key, h);
        else if (rank(h) === rank(prev) && h.isRaio && !prev.isRaio) uniq.set(key, h);
      }
      const finalList = Array.from(uniq.values()).sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));
      const hot = finalList.filter(x => x.isHeat || x.isRaio);
      setHorariosAll(finalList);
      setHorariosHot(hot);
      setShowAllSlots(false);
    } catch { setHorariosAll([]); setHorariosHot([]); setShowAllSlots(false); }
  };

  useEffect(() => {
    if (showAgendamento && flow.step === 3) carregarSlotsBanco();
  }, [showAgendamento, flow.profissional?.id, flow.data, flow.step, diaSelecionadoEhTrabalho, totalSelecionado.duracao]);

  const confirmarAgendamento = async () => {
    if (enviando) return;
    if (!user || userType !== 'client') { alertKey('schedule_must_be_client', 'Ação restrita', 'Você precisa estar logado como CLIENTE para agendar.', 'ENTENDI'); return; }
    if (!negocio?.id) { alertKey('schedule_invalid_business', 'Negócio inválido', 'Negócio inválido. Recarregue a vitrine.', 'ENTENDI'); return; }
    setEnviando(true);
    try {
      if (!flow.profissional || !flow.data || !flow.horario || !flow.servicosSelecionados?.length) {
        alertKey('schedule_incomplete_data', 'Dados incompletos', 'Dados incompletos. Refaça o agendamento.', 'ENTENDI'); return;
      }
      if (!diaSelecionadoEhTrabalho) {
        alertKey('schedule_closed_day', 'Profissional fechado', 'Esse profissional está FECHADO nesse dia. Escolha outra data.', 'ENTENDI');
        setFlow(prev => ({ ...prev, step: 1, horario: null, servicosSelecionados: [] })); return;
      }
      const durServicos = Number(totalSelecionado.duracao || 0);
      if (!durServicos) {
        const needOneMsg = bizV?.[businessGroup]?.schedule_need_one_service;
        if (needOneMsg) openAlert({ title: needOneMsg.title, body: needOneMsg.body, buttonText: needOneMsg.buttonText || 'ENTENDI' });
        else alertKey('schedule_need_one_service', 'Selecione um item', 'Selecione pelo menos 1 item.', 'ENTENDI');
        return;
      }
      const addMinutesToISO = (iso, minutes) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) throw new Error('Horário inválido.');
        return new Date(d.getTime() + (minutes * 60 * 1000)).toISOString();
      };
      const baseInicioISO = String(flow.horario.inicio || '');
      if (!baseInicioISO) { alertKey('schedule_pick_time', 'Selecione um horário', 'Selecione um horário.', 'ENTENDI'); return; }
      const ordered = Array.isArray(flow.servicosSelecionados) ? [...flow.servicosSelecionados] : [];
      const agendamentosParaInserir = [];
      let curInicioISO = baseInicioISO;
      for (let i = 0; i < ordered.length; i++) {
        const s = ordered[i];
        const dur = Number(s?.duracao_minutos || 0);
        if (!dur) continue;
        const iniDate = new Date(curInicioISO);
        const hIni = String(iniDate.getUTCHours()).padStart(2, '0');
        const mIni = String(iniDate.getUTCMinutes()).padStart(2, '0');
        const horarioIni = `${hIni}:${mIni}`;
        let curFimISO = addMinutesToISO(curInicioISO, dur);
        const isLast = i === ordered.length - 1;
        if (isLast) curFimISO = addMinutesToISO(curFimISO, FOLGA_MINUTOS);
        const fimDate = new Date(curFimISO);
        const hFim = String(fimDate.getUTCHours()).padStart(2, '0');
        const mFim = String(fimDate.getUTCMinutes()).padStart(2, '0');
        const horarioFim = `${hFim}:${mFim}`;
        agendamentosParaInserir.push({
          negocio_id: negocio.id, profissional_id: flow.profissional.id, cliente_id: user.id,
          entrega_id: s.id, data: flow.data, horario_inicio: horarioIni, horario_fim: horarioFim, status: 'agendado'
        });
        curInicioISO = curFimISO;
      }
      if (!agendamentosParaInserir.length) {
        const needValidMsg = bizV?.[businessGroup]?.schedule_need_valid_service;
        if (needValidMsg) openAlert({ title: needValidMsg.title, body: needValidMsg.body, buttonText: needValidMsg.buttonText || 'ENTENDI' });
        else alertKey('schedule_need_valid_service', 'Selecione um item', 'Selecione pelo menos 1 item válido.', 'ENTENDI');
        return;
      }
      const { error: insErr } = await withTimeout(
        supabase.from('agendamentos').insert(agendamentosParaInserir).select('id'), 10000, 'bulk-insert-agendamento'
      );
      if (insErr) {
        const msg = String(insErr.message || '').toLowerCase();
        const isOverlap = String(insErr.code || '') === '23P01' || msg.includes('impedir_sobreposicao') || msg.includes('exclusion') || msg.includes('overlap') || msg.includes('sobrepos');
        if (isOverlap) {
          alertKey('schedule_overlap_taken', 'Horário ocupado', 'Alguém acabou de reservar esse horário. Escolha outro.', 'ENTENDI');
          setFlow(prev => ({ ...prev, step: 3, horario: null }));
          await carregarSlotsBanco(); return;
        }
        throw insErr;
      }
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
          const nomeServico = flow.servicosSelecionados?.[0]?.nome || 'Serviço';
          await OneSignal.sendTags({ ultima_acao: "agendamento_realizado", servico_nome: nomeServico, data_agendamento: flow.data, horario_agendamento: flow.horario?.hora || '' });
        });
      }
      const link = gerarLinkGoogle(flow.servicosSelecionados[0]?.nome || 'Agendamento', flow.horario.inicio, totalSelecionado.duracao);
      setCalendarLink(link);
      setFlow(prev => ({ ...prev, step: 5 }));
    } catch (e) {
      const title = getMsg('schedule_create_error_title', 'Erro ao agendar');
      const body = `${getMsg('schedule_create_error_body', 'Erro ao criar agendamento:')} ${e?.message || ''}`;
      openAlert({ title, body, buttonText: getMsg('common_ok', 'ENTENDI') });
    } finally { setEnviando(false); }
  };

  const abrirAvaliar = async () => {
    if (!user) {
      const ok = await confirmKey('review_need_login_confirm', 'Login necessário', 'Você precisa fazer login para avaliar. Deseja fazer login agora?', 'IR PARA LOGIN', 'MAIS TARDE');
      if (ok) navigate('/login'); return;
    }
    if (userType !== 'client') { alertKey('review_only_client', 'Ação restrita', 'Apenas CLIENTE pode avaliar.', 'ENTENDI'); return; }
    setAvaliarNota(5); setAvaliarTexto(''); setAvaliarTipo('negocio'); setAvaliarProfissionalId(null); setShowAvaliar(true);
  };

  const enviarAvaliacao = async () => {
    if (!user || userType !== 'client') return;
    if (!negocio?.id) { alertKey('review_invalid_business', 'Negócio inválido', 'Negócio inválido.', 'ENTENDI'); return; }
    try {
      setAvaliarLoading(true);
      const payload = { cliente_id: user.id, tipo: avaliarTipo, nota: avaliarNota, comentario: avaliarTexto || null, negocio_id: avaliarTipo === 'negocio' ? negocio.id : null, profissional_id: avaliarTipo === 'profissional' ? avaliarProfissionalId : null };
      const { error: avErr } = await withTimeout(supabase.from('avaliacoes').insert(payload), 7000, 'enviar-avaliacao');
      if (avErr) throw avErr;
      setShowAvaliar(false);
      await loadVitrine();
      alertKey('review_sent', 'Avaliação enviada', 'Avaliação enviada!', 'OK');
    } catch (e) {
      const title = getMsg('review_send_error_title', 'Erro ao avaliar');
      const body = `${getMsg('review_send_error_body', 'Erro ao enviar avaliação:')} ${e?.message || ''}`;
      openAlert({ title, body, buttonText: getMsg('common_ok', 'ENTENDI') });
    } finally { setAvaliarLoading(false); }
  };

  const logoUrl = useMemo(() => getPublicUrl('logos', negocio?.logo_path), [negocio?.logo_path]);
  const instagramUrl = useMemo(() => resolveInstagram(negocio?.instagram), [negocio?.instagram]);
  const facebookUrl = useMemo(() => resolveFacebook(negocio?.facebook), [negocio?.facebook]);

  const entregasPorProf = useMemo(() => {
    const map = new Map();
    for (const p of profissionais) map.set(p.id, []);
    for (const s of entregas) {
      if (!map.has(s.profissional_id)) map.set(s.profissional_id, []);
      map.get(s.profissional_id).push(s);
    }
    return map;
  }, [profissionais, entregas]);

  const avaliacoesPorProf = useMemo(() => {
    const map = new Map();
    for (const av of avaliacoes) {
      if (av.profissional_id) {
        if (!map.has(av.profissional_id)) map.set(av.profissional_id, []);
        map.get(av.profissional_id).push(av);
      }
    }
    const medias = new Map();
    for (const [profId, avs] of map.entries()) {
      const media = avs.length > 0 ? (avs.reduce((sum, a) => sum + a.nota, 0) / avs.length).toFixed(1) : null;
      medias.set(profId, { media, count: avs.length });
    }
    return medias;
  }, [avaliacoes]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-primary text-2xl font-normal animate-pulse">CARREGANDO...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-100 border border-red-500/40 rounded-custom p-8 text-center">
        <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-normal text-white mb-2">Houve um erro ao carregar</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={loadVitrine} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button font-normal uppercase">Tentar novamente</button>
      </div>
    </div>
  );

  if (!negocio) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-normal text-white mb-4">Negócio inexistente.</h1>
        <Link to="/" className="text-primary hover:text-yellow-500 font-normal">Voltar para Home</Link>
      </div>
    </div>
  );

  const mediaAvaliacoes = avaliacoes.length > 0
    ? (avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length).toFixed(1)
    : '0.0';

  const nomeNegocioLabel = String(negocio?.nome || '').trim() || 'NEGÓCIO';
  const temaAtivo = negocio?.tema || 'dark';

  const renderSlotButton = (h, i, prefix) => {
    const isCancel = !!h.isRaio;
    const disabled = !h.cabe;
    return (
      <button
        key={`${prefix}-${i}`}
        disabled={disabled}
        onClick={() => {
          if (!h.cabe) {
            const maxServico = Math.max(0, Number(h.maxMinutos || 0) - FOLGA_MINUTOS);
            const bizMsgs = bizV?.[businessGroup];
            const title = getMsg('schedule_not_enough_time_title', 'Horário insuficiente');
            const body =
              `${bizMsgs?.schedule_not_enough_time_sad || ':( Esse horário é insuficiente para os itens selecionados.'}\n\n` +
              `${getMsg('schedule_not_enough_time_free', 'Tempo disponível')}: ${h.maxMinutos} MIN\n` +
              `${bizMsgs?.schedule_not_enough_time_need || 'Seu agendamento (itens + folga)'}: ${h.precisaMinutos} MIN\n\n` +
              `${getMsg('schedule_not_enough_time_fit', 'Cabe no máximo')}: ${maxServico} MIN ${bizMsgs?.schedule_not_enough_time_services || 'de itens'}.\n` +
              `${bizMsgs?.schedule_not_enough_time_hint || 'Escolha outro horário ou ajuste os itens.'}`;
            openAlert({ title, body, buttonText: getMsg('common_ok', 'ENTENDI') });
            return;
          }
          setFlow(prev => ({ ...prev, horario: h, step: 4 }));
        }}
        className={`relative p-3 rounded-custom transition-all bg-dark-200 border uppercase font-normal ${
          disabled ? 'border-gray-800 opacity-60 cursor-not-allowed' : 'border-gray-800 hover:border-primary'
        }`}
      >
        {isCancel && <Zap className="w-4 h-4 text-primary absolute top-1 right-1" />}
        <div className="text-lg normal-case">{h.hora}</div>
        <div className="text-[10px] text-gray-500 normal-case">ATÉ {h.maxMinutos} MIN</div>
      </button>
    );
  };

  return (
    <div className={`min-h-screen bg-vbg text-vtext${temaAtivo === 'light' ? ' vitrine-light' : ''}`}>
      <AlertModal open={nativeAlertOpen} onClose={closeAlert} title={nativeAlertData.title} body={nativeAlertData.body} buttonText={nativeAlertData.buttonText} />
      <ConfirmModal open={nativeConfirmOpen} title={nativeConfirmData.title} body={nativeConfirmData.body} confirmText={nativeConfirmData.confirmText} cancelText={nativeConfirmData.cancelText} onCancel={() => closeConfirm(false)} onConfirm={() => closeConfirm(true)} />

      {/* ─── Barra de anúncio ─────────────────────────────────────────────── */}
      <div className="bg-primary overflow-hidden relative h-10 flex items-center">
        <div className="announcement-bar-marquee flex whitespace-nowrap">
          <div className="flex animate-marquee-sync">
            <div className="flex items-center shrink-0">
              {[...Array(20)].map((_, index) => (
                <div key={`a-${index}`} className="flex items-center">
                  <span className="text-black font-normal text-sm uppercase mx-4">É DE MINAS</span>
                  <span className="text-black text-sm">●</span>
                </div>
              ))}
            </div>
            <div className="flex items-center shrink-0" aria-hidden="true">
              {[...Array(20)].map((_, index) => (
                <div key={`b-${index}`} className="flex items-center">
                  <span className="text-black font-normal text-sm uppercase mx-4">É DE MINAS</span>
                  <span className="text-black text-sm">●</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee-sync { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee-sync { display: flex; animation: marquee-sync 40s linear infinite; }
          .announcement-bar-marquee:hover .animate-marquee-sync { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) { .animate-marquee-sync { animation: none; } }
        `}</style>
      </div>

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-vcard border-b border-vborder sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-vsub hover:text-primary transition-colors uppercase">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={abrirAvaliar} disabled={!!isProfessional} className={`flex items-center gap-2 h-9 px-5 rounded-button transition-all bg-vcard2 border uppercase focus:outline-none focus:ring-0 focus:ring-offset-0 ${isProfessional ? 'border-vborder2 text-vmuted cursor-not-allowed' : 'border-vborder text-vsub hover:border-primary'}`}>
                <StarChar size={18} className="text-primary" />
                <span className="hidden sm:inline">Avaliar</span>
              </button>
              <button onClick={toggleFavorito} disabled={!!isProfessional} className={`h-9 flex items-center gap-2 px-5 rounded-button transition-all uppercase border focus:outline-none focus:ring-0 focus:ring-offset-0 ${isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : isFavorito ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-vcard2 border-vborder text-vsub hover:text-red-400'}`}>
                <Heart className={`w-5 h-5 ${isFavorito ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">{isProfessional ? 'Somente Cliente' : (isFavorito ? 'Favoritado' : 'Favoritar')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary/20 via-vbg to-yellow-600/20 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {logoUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-primary/30 bg-vcard">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center text-4xl sm:text-5xl font-normal text-black">
                {negocio.nome?.[0] || 'N'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal mb-3">{negocio.nome}</h1>
              <p className="text-base sm:text-lg text-vsub mb-4 font-normal">{negocio.descricao}</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <StarChar size={18} className="text-primary" />
                  <span className="text-xl font-normal text-primary">{mediaAvaliacoes}</span>
                </div>
                {negocio.endereco && (
                  <div className="flex items-center gap-2 text-vsub text-sm">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    <span className="font-normal">{negocio.endereco}</span>
                  </div>
                )}
                {negocio.telefone && (
                  <a href={`tel:${sanitizeTel(negocio.telefone) || negocio.telefone}`} className="flex items-center gap-2 text-primary hover:text-yellow-500 text-sm font-normal transition-colors">
                    <Phone className="w-4 h-4" strokeWidth={1.5} />{negocio.telefone}
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:text-yellow-500 text-sm font-normal transition-colors" aria-label="Instagram">
                    <Instagram className="w-4 h-4" strokeWidth={1.5} />clique :)
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:text-yellow-500 text-sm font-normal transition-colors" aria-label="Facebook">
                    <FacebookIcon size={16} />clique :)
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Profissionais ────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-normal mb-6">Profissionais</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionais.map(prof => {
              const totalEntregas = (entregasPorProf.get(prof.id) || []).length;
              const status = getProfStatus(prof);
              const avalInfo = avaliacoesPorProf.get(prof.id);
              const profissao = String(prof?.profissao ?? '').trim();
              const { ini: almIni, fim: almFim } = getAlmocoRange(prof);
              const avatarUrl = getPublicUrl('avatars', prof.avatar_path);
              return (
                <div key={prof.id} className="bg-vcard border border-vborder rounded-custom p-6 hover:border-primary/50 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    {avatarUrl ? (
                      <div className="w-14 h-14 rounded-custom overflow-hidden border border-vborder bg-vcard2 shrink-0">
                        <img src={avatarUrl} alt={prof.nome} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center text-2xl font-normal text-black shrink-0">
                        {prof.nome?.[0] || 'P'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-lg font-normal">{prof.nome}</h3>
                        {profissao && (
                          <span className="inline-block px-2 py-1 bg-primary/20 border border-primary/30 rounded-button text-[10px] text-primary font-normal uppercase whitespace-nowrap">{profissao}</span>
                        )}
                      </div>
                      {avalInfo && avalInfo.media && (
                        <div className="flex items-center gap-2 mb-1">
                          <StarChar size={16} className="text-primary" />
                          <span className="text-lg font-normal text-primary">{avalInfo.media}</span>
                          <span className="text-xs text-vmuted">({avalInfo.count})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                        <span className="text-xs text-vsub font-normal uppercase">{status.label}</span>
                      </div>
                      {prof.anos_experiencia != null && (
                        <p className="text-sm text-vmuted font-normal mt-1">{prof.anos_experiencia} ano(s) de experiência</p>
                      )}
                      <p className="text-xs text-vmuted font-normal mt-2">
                        Horário: <span className="text-vsub">{String(prof.horario_inicio || '08:00').slice(0, 5)} - {String(prof.horario_fim || '18:00').slice(0, 5)}</span>
                      </p>
                      {(almIni && almFim) && (
                        <p className="text-xs text-vmuted font-normal mt-1">
                          Almoço: <span className="text-vsub">{String(almIni).slice(0, 5)} - {String(almFim).slice(0, 5)}</span>
                        </p>
                      )}
                      <p className="text-xs text-vmuted font-normal mt-2">{totalEntregas} {totalEntregas === 1 ? counterSingular : counterPlural} disponíve{totalEntregas === 1 ? 'l' : 'is'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => iniciarAgendamento(prof)}
                    className={`w-full py-3 rounded-button hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase font-normal ${isProfessional ? 'bg-vcard2 border border-vborder text-vmuted cursor-not-allowed' : 'bg-gradient-to-r from-primary to-yellow-600 text-black'}`}
                    disabled={!!isProfessional}
                  >
                    <Calendar className="w-5 h-5" />{btnAgendarLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Entregas (seção dinâmica) ────────────────────────────────────── */}
      <section className="py-12">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-normal mb-6">{sectionTitle}</h2>
        </div>
        {profissionais.length === 0 ? (
          <p className="text-vmuted font-normal px-4 sm:px-6 lg:px-8">Nenhum profissional cadastrado.</p>
        ) : (
          <div className="space-y-px">
            {profissionais.map(p => {
                const lista = (entregasPorProf.get(p.id) || [])
                  .slice()
                  .sort((a, b) => {
                    const pa = Number(getPrecoFinalServico(a) ?? 0);
                    const pb = Number(getPrecoFinalServico(b) ?? 0);
                    if (pb !== pa) return pb - pa;
                    return String(a.nome || '').localeCompare(String(b.nome || ''));
                  });
                return (
                  <div key={p.id} className="bg-vcard border-t border-b border-vborder w-full px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-normal text-lg">{p.nome}</div>
                      <div className="text-xs text-vmuted font-normal">{lista.length} {lista.length === 1 ? counterSingular : counterPlural}</div>
                    </div>
                    {lista.length ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {lista.map(s => {
                          const preco = Number(s.preco ?? 0);
                          const promo = Number(s.preco_promocional ?? 0);
                          const temPromo = Number.isFinite(promo) && promo > 0 && promo < preco;
                          const precoFinal = getPrecoFinalServico(s);
                          return (
                            <div key={s.id} className="relative bg-vcard2 border border-vborder rounded-custom p-4">
                              {temPromo && (
                                <div className="absolute top-2 right-2">
                                  <span className="inline-block px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded-button text-[9px] text-green-400 font-normal uppercase">OFERTA</span>
                                </div>
                              )}
                              <div className="font-normal text-sm leading-tight pr-10">{s.nome}</div>
                              <div className="text-xs text-vmuted font-normal mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />{s.duracao_minutos} MIN
                              </div>
                              {!temPromo ? (
                                <div className="text-primary font-normal text-base mt-2">R$ {precoFinal.toFixed(2)}</div>
                              ) : (
                                <div className="mt-2">
                                  <div className="text-green-400 font-normal text-base">R$ {precoFinal.toFixed(2)}</div>
                                  <div className="text-red-400 text-xs font-normal line-through">R$ {preco.toFixed(2)}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-vmuted font-normal">{emptyListMsg}</p>
                    )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* ─── Galeria ──────────────────────────────────────────────────────── */}
      {galeriaItems.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {galeriaItems.map((item) => {
                const url = getPublicUrl('galerias', item.path);
                if (!url) return null;
                return (
                  <div key={item.id} className="mb-3 w-full break-inside-avoid overflow-hidden rounded-custom border border-vborder bg-vcard">
                    <img src={url} alt="Galeria" className="w-full h-auto object-contain bg-vbg" loading="lazy" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Avaliações ───────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-normal">Avaliações</h2>
            <button onClick={abrirAvaliar} disabled={!!isProfessional} className={`px-5 py-2 border rounded-button text-sm transition-all uppercase font-normal ${isProfessional ? 'bg-vcard border-vborder2 text-vmuted cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'}`}>
              + Avaliar
            </button>
          </div>
          {avaliacoes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {avaliacoes.map(av => {
                const avatarClienteUrl = getPublicUrl('avatars', av.users?.avatar_path);
                return (
                  <div key={av.id} className="bg-vcard border border-vborder rounded-custom p-4 relative">
                    <div className="absolute top-3 right-3">
                      {av.profissional_id && av.profissionais?.nome ? (
                        <span className="inline-block px-1.5 py-0.5 bg-primary/20 border border-primary/30 rounded-button text-[10px] text-primary font-normal uppercase">{av.profissionais.nome}</span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-button text-[10px] text-blue-400 font-normal uppercase">{nomeNegocioLabel}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {avatarClienteUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-vborder bg-vcard2 shrink-0">
                          <img src={avatarClienteUrl} alt={av.users?.nome} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-normal shrink-0">
                          {av.users?.nome?.[0] || 'A'}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-normal">{av.users?.nome || 'Cliente'}</p>
                        <Stars5Char value={av.nota} size={14} />
                      </div>
                    </div>
                    {av.comentario && <p className="text-sm text-vsub font-normal">{av.comentario}</p>}
                  </div>
                );
              })}
            </div>
          ) : <p className="text-vmuted font-normal">Nenhuma avaliação ainda</p>}
        </div>
      </section>

      {/* ─── Modal Agendamento ────────────────────────────────────────────── */}
      {showAgendamento && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-30 bg-dark-100 border-b border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-normal text-white">AGENDAR COM {flow.profissional?.nome}</h2>
              <button onClick={() => setShowAgendamento(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 relative z-0">

              {flow.step === 1 && (
                <div>
                  <h3 className="text-xl font-normal mb-4 text-white">ESCOLHA A DATA</h3>
                  <DatePickerButton value={flow.data} min={minDateSP} placeholder="Selecionar data" onChange={(e) => setFlow(prev => ({ ...prev, data: e.target.value }))} />
                  {flow.data && !diaSelecionadoEhTrabalho && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-custom p-3 text-red-300 text-sm font-normal">
                      Este profissional está <b>FECHADO</b> nessa data. Escolha outro dia.
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!flow.data) { alertKey('schedule_pick_date', 'Selecione uma data', 'Selecione uma data.', 'ENTENDI'); return; }
                      if (!diaSelecionadoEhTrabalho) { alertKey('schedule_closed_day', 'Profissional fechado', 'Esse profissional está FECHADO nesse dia. Escolha outra data.', 'ENTENDI'); return; }
                      setFlow(prev => ({ ...prev, step: 2, horario: null, servicosSelecionados: [] }));
                    }}
                    className={`mt-4 w-full py-3 rounded-button uppercase font-normal ${(!flow.data || !diaSelecionadoEhTrabalho) ? 'bg-dark-200 border border-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-yellow-600 text-black'}`}
                    disabled={!flow.data || !diaSelecionadoEhTrabalho}
                  >
                    CONTINUAR
                  </button>
                </div>
              )}

              {flow.step === 2 && (
                <div>
                  <button onClick={() => setFlow(prev => ({ ...prev, step: 1, servicosSelecionados: [], horario: null }))} className="text-primary mb-4 uppercase font-normal">VOLTAR</button>
                  <h3 className="text-xl font-normal mb-2 text-white">Selecione {sectionTitle}</h3>
                  <div className="mb-4 bg-dark-200 border border-gray-800 rounded-custom p-4">
                    <div className="flex justify-between text-sm"><span className="text-gray-500 font-normal">SELECIONADOS:</span><span className="font-normal text-white">{totalSelecionado.qtd}</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-gray-500 font-normal">TEMPO ESTIMADO:</span><span className="font-normal text-gray-200">{totalSelecionado.duracao} MIN</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-gray-500 font-normal">FOLGA:</span><span className="font-normal text-gray-200">{totalSelecionado.duracao ? FOLGA_MINUTOS : 0} MIN</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-gray-500 font-normal">TEMPO TOTAL:</span><span className="font-normal text-primary">{duracaoTotalComFolga || 0} MIN</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-gray-500 font-normal">VALOR TOTAL:</span><span className="font-normal text-primary">R$ {totalSelecionado.valor.toFixed(2)}</span></div>
                  </div>
                  {entregasPossiveis.length > 0 ? (
                    <div className="space-y-3">
                      {entregasPossiveis.map(s => {
                        const selected = (flow.servicosSelecionados || []).some(x => x.id === s.id);
                        const precoFinal = getPrecoFinalServico(s);
                        return (
                          <button key={s.id} onClick={() => { const cur = Array.isArray(flow.servicosSelecionados) ? [...flow.servicosSelecionados] : []; const next = selected ? cur.filter(x => x.id !== s.id) : [...cur, s]; setFlow(prev => ({ ...prev, servicosSelecionados: next })); }} className={`w-full rounded-custom p-4 transition-all text-left border-2 ${selected ? 'bg-primary/10 border-primary' : 'bg-dark-200 border-gray-800 hover:border-primary/50'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-normal text-white">{s.nome}</p>
                                <p className="text-sm text-gray-500 font-normal"><Clock className="w-4 h-4 inline mr-1" />{s.duracao_minutos} MIN</p>
                              </div>
                              <div className="text-2xl font-normal text-primary">R$ {precoFinal.toFixed(2)}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : <div className="text-gray-500 font-normal">Nenhum {counterSingular} disponível.</div>}
                  <button
                    onClick={() => {
                      if (!flow.servicosSelecionados?.length) {
                        const needOneMsg = bizV?.[businessGroup]?.schedule_need_one_service;
                        if (needOneMsg) openAlert({ title: needOneMsg.title, body: needOneMsg.body, buttonText: needOneMsg.buttonText || 'ENTENDI' });
                        else alertKey('schedule_need_one_service', 'Selecione um item', 'Selecione pelo menos 1 item.', 'ENTENDI');
                        return;
                      }
                      setFlow(prev => ({ ...prev, step: 3, horario: null }));
                    }}
                    className={`mt-4 w-full py-3 rounded-button uppercase font-normal ${flow.servicosSelecionados?.length ? 'bg-gradient-to-r from-primary to-yellow-600 text-black' : 'bg-dark-200 border border-gray-800 text-gray-500 cursor-not-allowed'}`}
                    disabled={!flow.servicosSelecionados?.length}
                  >
                    Continuar
                  </button>
                </div>
              )}

              {flow.step === 3 && (
                <div>
                  <button onClick={() => setFlow(prev => ({ ...prev, step: 2, horario: null }))} className="text-primary mb-4 font-normal uppercase">Voltar</button>
                  <h3 className="text-xl font-normal mb-4 text-white">ESCOLHA O HORÁRIO</h3>
                  {!diaSelecionadoEhTrabalho ? (
                    <p className="text-gray-500 font-normal">Esse profissional está fechado nessa data.</p>
                  ) : horariosHot.length > 0 ? (
                    <div className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 font-normal uppercase mb-1">HORÁRIOS INTELIGENTES</div>
                          <div className="text-sm text-gray-200 font-normal">Lista priorizada pelo sistema.</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">{horariosHot.map((h, i) => renderSlotButton(h, i, 'hot'))}</div>
                      {horariosAll.length > 0 && (
                        <>
                          <button type="button" onClick={() => setShowAllSlots(v => !v)} className="w-full mt-4 px-4 py-3 rounded-button border bg-dark-100 border-gray-800 text-gray-200 uppercase font-normal">
                            {showAllSlots ? 'OCULTAR HORÁRIOS' : 'VER MAIS HORÁRIOS'}
                          </button>
                          {showAllSlots && (
                            <div className="mt-4">
                              <div className="text-xs text-gray-500 font-normal uppercase mb-3">TODOS OS HORÁRIOS</div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">{horariosAll.map((h, i) => renderSlotButton(h, i, 'all'))}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 font-normal uppercase mb-1">HORÁRIOS DISPONÍVEIS</div>
                          <div className="text-sm text-gray-200 font-normal">Lista completa de horários calculados pelo sistema.</div>
                        </div>
                      </div>
                      {horariosAll.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">{horariosAll.map((h, i) => renderSlotButton(h, i, 'all'))}</div>
                      ) : (
                        <div className="flex items-center justify-center bg-yellow-500/10 border border-yellow-500/30 rounded-button p-3 text-yellow-300 text-sm font-normal text-center">
                          Nenhum horario disponivel nessa data :(
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {flow.step === 4 && (
                <div>
                  <h3 className="text-xl font-normal mb-4 text-white">CONFIRMAR AGENDAMENTO</h3>
                  <div className="bg-dark-200 rounded-custom p-4 space-y-3 mb-6">
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">PROFISSIONAL:</span><span className="font-normal text-white">{flow.profissional?.nome}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">DATA:</span><span className="font-normal text-white">{formatDateBR(flow.data)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">HORÁRIO:</span><span className="font-normal text-white">{flow.horario?.hora}</span></div>
                    <div className="pt-2 border-t border-gray-800">
                      <div className="text-gray-500 font-normal text-sm mb-2">SERVIÇOS:</div>
                      <div className="space-y-1">
                        {(flow.servicosSelecionados || []).map(s => (
                          <div key={s.id} className="flex justify-between text-sm">
                            <span className="font-normal text-gray-200">{s.nome}</span>
                            <span className="text-gray-400 font-normal">{s.duracao_minutos} MIN • R$ {getPrecoFinalServico(s).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">TEMPO ESTIMADO:</span><span className="font-normal text-white">{totalSelecionado.duracao} MIN</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">FOLGA:</span><span className="font-normal text-white">{FOLGA_MINUTOS} MIN</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">TOTAL PARA ENCAIXE:</span><span className="font-normal text-primary">{duracaoTotalComFolga} MIN</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-normal">VALOR TOTAL:</span><span className="font-normal text-primary text-xl">R$ {totalSelecionado.valor.toFixed(2)}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setFlow(prev => ({ ...prev, step: 3 }))} className="flex-1 py-3 bg-dark-200 border border-gray-800 rounded-button uppercase font-normal text-white" disabled={enviando}>VOLTAR</button>
                    <button onClick={confirmarAgendamento} disabled={enviando} className="flex-1 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal disabled:opacity-60">
                      {enviando ? 'ENVIANDO...' : 'CONFIRMAR'}
                    </button>
                  </div>
                </div>
              )}

              {flow.step === 5 && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-normal mb-2 text-white">AGENDADO</h3>
                  <p className="text-gray-400 font-normal mb-6">Salve um lembrete no seu celular para se lembrar.</p>
                  <a href={calendarLink} target="_blank" rel="noreferrer" className="block w-full py-4 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button uppercase font-normal mb-3">ADICIONAR A MINHA AGENDA</a>
                  <button onClick={() => { setShowAgendamento(false); navigate('/minha-area'); }} className="w-full py-3 bg-transparent border border-red-500 text-red-500 rounded-button uppercase font-normal hover:bg-red-500/10 transition-colors">PREFIRO ESQUECER</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Avaliar ────────────────────────────────────────────────── */}
      {showAvaliar && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 shrink-0">
              <h3 className="text-2xl font-normal text-white">AVALIAR</h3>
              <button onClick={() => setShowAvaliar(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 flex-1">
              <div className="mb-4">
                <div className="text-sm text-gray-300 font-normal mb-2">Você está avaliando</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setAvaliarTipo('negocio'); setAvaliarProfissionalId(null); }} className={`px-4 py-3 rounded-custom border transition-all font-normal ${avaliarTipo === 'negocio' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-dark-200 border-gray-800 text-gray-400'}`}>{nomeNegocioLabel}</button>
                  <button onClick={() => setAvaliarTipo('profissional')} className={`px-4 py-3 rounded-custom border transition-all font-normal ${avaliarTipo === 'profissional' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-400'}`}>PROFISSIONAL</button>
                </div>
              </div>
              {avaliarTipo === 'profissional' && (
                <div className="mb-4">
                  <div className="text-sm text-gray-300 font-normal mb-2">Qual profissional?</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {profissionais.map(prof => (
                      <button key={prof.id} onClick={() => setAvaliarProfissionalId(prof.id)} className={`w-full text-left px-4 py-3 rounded-custom border transition-all font-normal ${avaliarProfissionalId === prof.id ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-400 hover:border-primary/30'}`}>{prof.nome}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <div className="text-sm text-gray-300 font-normal mb-2">Nota</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setAvaliarNota(n)} className={`w-12 h-8 rounded-button border transition-all font-normal ${avaliarNota >= n ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-500'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-sm text-gray-300 font-normal mb-2">Comentário é opcional</div>
                <textarea value={avaliarTexto} onChange={(e) => setAvaliarTexto(e.target.value)} rows={4} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none" placeholder="Conte como foi sua experiência..." />
              </div>
              <button onClick={enviarAvaliacao} disabled={avaliarLoading || (avaliarTipo === 'profissional' && !avaliarProfissionalId)} className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button disabled:opacity-60 uppercase font-normal">
                {avaliarLoading ? 'ENVIANDO...' : 'AVALIAR AGORA'}
              </button>
              <p className="text-xs text-gray-500 mt-3 font-normal">
                {avaliarTipo === 'profissional' && !avaliarProfissionalId ? 'Selecione um profissional para continuar' : 'Somente clientes logados podem avaliar.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
