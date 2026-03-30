import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, X, Eye, Calendar,
  Users, TrendingUp, Award, LogOut, AlertCircle, Clock,
  Save
} from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';
import { getBusinessGroup } from '../businessTerms';
import { ptBR } from '../feedback/messages/ptBR.js';
import DatePicker from '../components/DatePicker';
import PeriodoSelect from '../components/PeriodoSelect';
import ProfissionalSelect from '../components/ProfissionalSelect';
import TimePicker from '../components/TimePicker';

/* ─── Design tokens (mesmos da Home) ─────────────────────────────────────── */
const DS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
  :root {
    --gold: #C9A84C;
    --gold-dim: rgba(201,168,76,0.10);
    --gold-line: rgba(201,168,76,0.20);
    --surface: #0d0d0d;
    --surface2: #111111;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(255,255,255,0.14);
    --text: #e8e8e8;
    --muted: #666;
  }
  *, *::before, *::after { box-sizing: border-box; }
  .dash-root { font-family: 'DM Sans', sans-serif; background: #080808; color: var(--text); min-height: 100vh; }
  .serif { font-family: 'DM Serif Display', Georgia, serif; }

  /* Nav */
  .d-nav { background: #080808; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
  .d-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 56px; }

  /* Ticker */
  .d-ticker { border-bottom: 1px solid var(--border); background: #050505; overflow: hidden; height: 36px; display: flex; align-items: center; }
  .d-ticker-inner { display: inline-flex; animation: ticker 50s linear infinite; white-space: nowrap; }
  .d-ticker-inner:hover { animation-play-state: paused; }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @media(prefers-reduced-motion:reduce){ .d-ticker-inner{animation:none} }

  /* Cards */
  .d-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; transition: border-color .2s; }
  .d-card:hover { border-color: var(--border-hover); }
  .d-card-gold { border-color: var(--gold-line); }

  /* Tabs */
  .d-tabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--border); }
  .d-tab { flex-shrink: 0; padding: 14px 20px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); transition: color .2s; position: relative; cursor: pointer; background: none; border: none; font-family: inherit; }
  .d-tab:hover { color: var(--text); }
  .d-tab.active { color: var(--gold); }
  .d-tab.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--gold); }

  /* Stat blocks */
  .d-stat { border-left: 1px solid var(--gold-line); padding-left: 20px; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; border: 1px solid; }
  .badge-blue   { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.25); color: #93c5fd; }
  .badge-green  { background: rgba(34,197,94,.10);  border-color: rgba(34,197,94,.25);  color: #86efac; }
  .badge-red    { background: rgba(239,68,68,.10);  border-color: rgba(239,68,68,.25);  color: #fca5a5; }
  .badge-yellow { background: rgba(234,179,8,.10);  border-color: rgba(234,179,8,.25);  color: #fde047; }
  .badge-gray   { background: rgba(255,255,255,.05); border-color: var(--border);       color: var(--muted); }
  .badge-gold   { background: var(--gold-dim); border-color: var(--gold-line); color: var(--gold); }

  /* Buttons */
  .btn-gold { display: inline-flex; align-items: center; gap: 8px; padding: 9px 20px; border-radius: 4px; background: var(--gold); color: #080808; font-size: 12px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; transition: opacity .2s; border: none; cursor: pointer; font-family: inherit; }
  .btn-gold:hover { opacity: .88; }
  .btn-gold:disabled { opacity: .4; cursor: not-allowed; }

  .btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; transition: border-color .2s, color .2s; background: none; cursor: pointer; font-family: inherit; }
  .btn-outline:hover { border-color: var(--border-hover); color: var(--text); }
  .btn-outline:disabled { opacity: .4; cursor: not-allowed; }

  .btn-danger { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 4px; border: 1px solid rgba(239,68,68,.25); color: #fca5a5; background: rgba(239,68,68,.08); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; transition: background .2s; cursor: pointer; font-family: inherit; }
  .btn-danger:hover { background: rgba(239,68,68,.14); }

  .btn-success { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 4px; border: 1px solid rgba(34,197,94,.25); color: #86efac; background: rgba(34,197,94,.08); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; transition: background .2s; cursor: pointer; font-family: inherit; }
  .btn-success:hover { background: rgba(34,197,94,.14); }

  /* Inputs */
  .d-input { width: 100%; padding: 10px 14px; background: #080808; border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-size: 14px; font-family: inherit; transition: border-color .2s; outline: none; }
  .d-input:focus { border-color: var(--gold-line); }
  .d-input::placeholder { color: var(--muted); }

  /* Modal */
  .d-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.85); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .d-modal { background: #0d0d0d; border: 1px solid var(--border); border-radius: 8px; max-width: 480px; width: 100%; padding: 32px; max-height: 90vh; overflow-y: auto; }

  /* Divider */
  .d-divider { border: none; border-top: 1px solid var(--border); margin: 0; }

  /* Label */
  .d-label { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 8px; }

  /* Notif dot */
  .notif-dot { position: absolute; top: 10px; right: 10px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--gold); color: #080808; font-size: 9px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
`;

/* ─── Constantes e helpers (idênticos ao original) ───────────────────────── */
const STATUS_COLOR_CLASS = {
  ABERTO: 'bg-green-500',
  FECHADO: 'bg-red-500',
  ALMOCO: 'bg-yellow-400',
  INATIVO: 'bg-gray-600',
};

const SUPORTE_PHONE_E164 = '5533999037979';
const SUPORTE_MSG = 'Olá, sou cadastrado como Profissional e gostaria de uma ajuda especializada para o meu perfil. Pode me orientar?';
const SUPORTE_HREF = `https://wa.me/${SUPORTE_PHONE_E164}?text=${encodeURIComponent(SUPORTE_MSG)}`;

const AG_PAGE_SIZE = 15;
const IMAGE_EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const toNumberOrNull = (v) => {
  if (v === '' || v == null) return null;
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) ? n : null;
};
const sameDay = (a, b) => String(a || '') === String(b || '');
function timeToMinutes(t) { if (!t) return 0; const [h, m] = String(t).split(':').map(Number); return (h * 60) + (m || 0); }
const getAgDate   = (a) => String(a?.data ?? '');
const getAgInicio = (a) => String(a?.horario_inicio ?? '').slice(0, 5);
const normalizeStatus = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const isCancelStatus = (s) => normalizeStatus(s).includes('cancelado');
const isDoneStatus   = (s) => normalizeStatus(s) === 'concluido';
const computeStatusFromDb = (a) => String(a?.status || '');
function formatDateBRFromISO(dateStr) { if (!dateStr) return 'Selecionar'; const [y, m, d] = String(dateStr).split('-'); if (!y || !m || !d) return String(dateStr); return `${d}.${m}.${y}`; }
function getPublicUrl(bucket, path) { if (!bucket || !path) return null; try { const stripped = path.replace(new RegExp(`^${bucket}/`), ''); const { data } = supabase.storage.from(bucket).getPublicUrl(stripped); return data?.publicUrl || null; } catch { return null; } }
function getImageExt(file) { return IMAGE_EXT_BY_MIME[file?.type] || null; }
function getValorEntrega(entrega) { const preco = Number(entrega?.preco ?? 0); const promoRaw = entrega?.preco_promocional; const promo = (promoRaw == null || promoRaw === '') ? null : Number(promoRaw); if (promo != null && Number.isFinite(promo) && promo > 0 && promo < preco) return promo; return preco; }
function getValorAgendamento(a) { const frozen = Number(a?.preco_final); if (Number.isFinite(frozen) && frozen > 0) return frozen; return getValorEntrega(a?.entregas); }
const toUpperClean = (s) => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();
const isEnderecoPadrao = (s) => /^.+,\s*\d+.*\s-\s.+,\s.+$/.test(String(s || '').trim());
const normalizeKey = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const getBizLabel = (group, key) => ptBR?.dashboard?.business?.[key]?.[group] ?? ptBR?.dashboard?.business?.[key]?.['servicos'] ?? '';

/* ─── TemaToggle (lógica inalterada, visual atualizado) ──────────────────── */
function TemaToggle({ value, onChange, loading }) {
  const isLight = value === 'light';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: !isLight ? 'var(--gold)' : 'var(--muted)' }}>Dark</span>
      <button type="button" disabled={loading} onClick={() => onChange(isLight ? 'dark' : 'light')}
        style={{ position: 'relative', width: 48, height: 26, borderRadius: 999, border: '1px solid var(--border)', background: isLight ? '#e8e8e8' : 'var(--surface)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .5 : 1, transition: 'background .3s', outline: 'none' }}>
        <span style={{ position: 'absolute', top: 2, left: isLight ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: isLight ? '#080808' : 'var(--gold)', transition: 'left .3s', display: 'block' }} />
      </button>
      <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: isLight ? 'var(--gold)' : 'var(--muted)' }}>White</span>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = useFeedback();

  const uiAlert   = async (key, variant = 'info') => { if (feedback?.showMessage) return feedback.showMessage(key, { variant }); return Promise.resolve(); };
  const uiConfirm = async (key, variant = 'warning') => { if (feedback?.confirm) return !!(await feedback.confirm(key, { variant })); return false; };
  const uiPrompt  = async (key, opts = {}) => { if (feedback?.prompt) return await feedback.prompt(key, opts); return null; };

  // ── State (100% idêntico ao original) ───────────────────────────────────
  const [parceiroProfissional, setParceiroProfissional] = useState(null);
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [negocio, setNegocio]             = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [entregas, setEntregas]           = useState([]);
  const [agendamentos, setAgendamentos]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [serverNow, setServerNow]         = useState(() => ({ ts: null, dow: 0, date: '', source: 'db', minutes: 0 }));
  const [hoje, setHoje]                   = useState(() => '');
  const souDono = negocio?.owner_id === user?.id;
  const acessoDashboardAutorizado = souDono || !!parceiroProfissional;

  const checarPermissao = useCallback(async (profissionalId) => {
    if (!acessoDashboardAutorizado) { await uiAlert('dashboard.parceiro_acao_proibida', 'warning'); return false; }
    if (!parceiroProfissional) return true;
    if (parceiroProfissional.id === profissionalId) return true;
    await uiAlert('dashboard.parceiro_acao_proibida', 'warning'); return false;
  }, [acessoDashboardAutorizado, parceiroProfissional]);

  const agProfIds = useMemo(() => profissionais.map(p => p.id), [profissionais]);

  const [historicoAgendamentos, setHistoricoAgendamentos] = useState([]);
  const [historicoPage, setHistoricoPage]                 = useState(0);
  const [historicoHasMore, setHistoricoHasMore]           = useState(false);
  const [historicoLoadingMore, setHistoricoLoadingMore]   = useState(false);
  const [historicoData, setHistoricoData]                 = useState('');
  const [faturamentoData, setFaturamentoData]             = useState('');
  const [faturamentoPeriodo, setFaturamentoPeriodo]       = useState('7d');
  const [metricsHoje, setMetricsHoje]               = useState(null);
  const [metricsDia, setMetricsDia]                 = useState(null);
  const [metricsPeriodoData, setMetricsPeriodoData] = useState(null);
  const [metricsHojeLoading, setMetricsHojeLoading]       = useState(false);
  const [metricsDiaLoading, setMetricsDiaLoading]         = useState(false);
  const [metricsPeriodoLoading, setMetricsPeriodoLoading] = useState(false);
  const [showNovaEntrega, setShowNovaEntrega]       = useState(false);
  const [submittingEntrega, setSubmittingEntrega]   = useState(false);
  const [editingEntregaId, setEditingEntregaId]     = useState(null);
  const [logoUploading, setLogoUploading]           = useState(false);
  const [formEntrega, setFormEntrega] = useState({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
  const [infoSaving, setInfoSaving]             = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galeriaItems, setGaleriaItems]         = useState([]);
  const [formInfo, setFormInfo] = useState({ nome: '', descricao: '', telefone: '', endereco: '', instagram: '', facebook: '', tema: 'dark' });
  const [temaSaving, setTemaSaving]             = useState(false);
  const [novoEmail, setNovoEmail]           = useState(user?.email || '');
  const [novaSenha, setNovaSenha]           = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingDados, setSavingDados]       = useState(false);
  const [notifAgendamentos, setNotifAgendamentos] = useState(0);
  const [notifCancelados, setNotifCancelados]     = useState(0);
  const [ownerBusinessCount, setOwnerBusinessCount] = useState(0);
  const [showEditProfissional, setShowEditProfissional]       = useState(false);
  const [editingProfissionalId, setEditingProfissionalId]     = useState(null);
  const [submittingProfissional, setSubmittingProfissional]   = useState(false);
  const [formProfissional, setFormProfissional] = useState({ nome: '', profissao: '', anos_experiencia: '', horario_inicio: '08:00', horario_fim: '18:00', almoco_inicio: '', almoco_fim: '', dias_trabalho: [1,2,3,4,5,6] });
  const [submittingAdminProf, setSubmittingAdminProf] = useState(false);

  const WEEKDAYS = [
    { value: 0, label: 'DOM' }, { value: 1, label: 'SEG' }, { value: 2, label: 'TER' },
    { value: 3, label: 'QUA' }, { value: 4, label: 'QUI' }, { value: 5, label: 'SEX' },
    { value: 6, label: 'SÁB' },
  ];

  useEffect(() => { setNovoEmail(user?.email || ''); }, [user?.email]);

  const businessGroup    = useMemo(() => getBusinessGroup(negocio?.tipo_negocio), [negocio?.tipo_negocio]);
  const tabEntregasLabel = useMemo(() => getBizLabel(businessGroup, 'tab_title').toUpperCase(), [businessGroup]);
  const sectionTitle     = useMemo(() => getBizLabel(businessGroup, 'tab_title'), [businessGroup]);
  const btnAddLabel      = useMemo(() => getBizLabel(businessGroup, 'button_add'), [businessGroup]);
  const modalNewLabel    = useMemo(() => getBizLabel(businessGroup, 'modal_new'), [businessGroup]);
  const modalEditLabel   = useMemo(() => getBizLabel(businessGroup, 'modal_edit'), [businessGroup]);
  const counterSingular  = useMemo(() => getBizLabel(businessGroup, 'counter_singular'), [businessGroup]);
  const counterPlural    = useMemo(() => getBizLabel(businessGroup, 'counter_plural'), [businessGroup]);
  const emptyListMsg     = useMemo(() => getBizLabel(businessGroup, 'empty_list'), [businessGroup]);
  const adminJaEhProfissional = useMemo(() => profissionais.some(p => p.user_id === user?.id), [profissionais, user?.id]);

  // ── Data fetching (100% idêntico ao original) ────────────────────────────
  const fetchNowFromDb = useCallback(async () => {
    const { data, error: rpcErr } = await supabase.rpc('now_sp');
    if (rpcErr) throw rpcErr;
    const payload = data?.[0] ?? data;
    if (!payload || !payload.date) throw new Error('now_sp vazio');
    setServerNow(payload); setHoje(String(payload.date));
    return String(payload.date);
  }, []);

  const reloadFull = useCallback(async () => {
    try { const d = await fetchNowFromDb(); await loadData(d); } catch { await loadData(''); }
  }, [fetchNowFromDb]);

  useEffect(() => { if (!user?.id) return; fetchNowFromDb().then(d => loadData(d)); }, [user?.id]);

  const reloadAgendamentos = useCallback(async (negocioId, profIds, dataHoje) => {
    const id = negocioId || negocio?.id; const ids = profIds || agProfIds; const dh = dataHoje || hoje; if (!id || !ids?.length || !dh) return;
    const { data, error: err } = await supabase.from('agendamentos')
      .select(`*, preco_final, data, horario_inicio, horario_fim, entregas (nome, preco, preco_promocional), profissionais (id, nome), cliente:users!agendamentos_cliente_id_fkey (id, nome, avatar_path, type)`)
      .eq('negocio_id', id).in('profissional_id', ids).gte('data', dh)
      .order('data', { ascending: true }).order('horario_inicio', { ascending: true }).order('id', { ascending: true });
    if (err) return;
    setAgendamentos((data || []).map(a => ({ ...a, data: a?.data ?? null, horario_inicio: a?.horario_inicio ?? null, horario_fim: a?.horario_fim ?? null })));
  }, [negocio?.id, agProfIds, hoje]);

  const reloadAgendamentosRef = useRef(reloadAgendamentos);
  useEffect(() => { reloadAgendamentosRef.current = reloadAgendamentos; }, [reloadAgendamentos]);

  const agProfIdsKey = useMemo(() => profissionais.map(p => p.id).sort().join(','), [profissionais]);

  useEffect(() => {
    if (!negocio?.id || !agProfIdsKey || !hoje) return;
    const channel = supabase.channel(`agendamentos:${negocio.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos', filter: `negocio_id=eq.${negocio.id}` }, (payload) => {
        const ev = payload?.eventType; const novo = payload?.new;
        const profIdEvento = novo?.profissional_id; const meuId = parceiroProfissional?.id || null;
        const meResponde = !meuId || profIdEvento === meuId;
        if (ev === 'INSERT' && meResponde) setNotifAgendamentos(prev => prev + 1);
        if (ev === 'UPDATE' && meResponde) { const st = String(novo?.status || '').toLowerCase(); if (st.includes('cancelado') && !st.includes('profissional')) setNotifCancelados(prev => prev + 1); }
        reloadAgendamentosRef.current();
        loadHoje(negocio.id, parceiroProfissional?.id ?? null);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [negocio?.id, agProfIdsKey, hoje, parceiroProfissional?.id]);

  useEffect(() => { setHistoricoData(prev => prev ? prev : hoje); setFaturamentoData(prev => prev ? prev : hoje); }, [hoje]);

  const loadHoje = async (negocioId, profId = null) => {
    const id = negocioId || negocio?.id; if (!id) return;
    try { setMetricsHojeLoading(true); const params = { p_negocio_id: id }; if (profId) params.p_profissional_id = profId; const { data, error } = await supabase.rpc('get_dashboard_today', params); if (error) throw error; setMetricsHoje(data); } catch { setMetricsHoje(null); } finally { setMetricsHojeLoading(false); }
  };
  const loadDia = async (negocioId, dateISO, profId = null) => {
    const id = negocioId || negocio?.id; const date = String(dateISO || faturamentoData || hoje || ''); if (!id || !date) return;
    try { setMetricsDiaLoading(true); const params = { p_negocio_id: id, p_date: date }; if (profId) params.p_profissional_id = profId; const { data, error } = await supabase.rpc('get_dashboard_day', params); if (error) throw error; setMetricsDia(data); } catch { setMetricsDia(null); } finally { setMetricsDiaLoading(false); }
  };
  const loadPeriodo = async (negocioId, refDateISO, periodo, profId = null) => {
    const id = negocioId || negocio?.id; const refDate = String(refDateISO || hoje || ''); const per = String(periodo || faturamentoPeriodo || '7d'); if (!id || !refDate) return;
    try { setMetricsPeriodoLoading(true); const params = { p_negocio_id: id, p_ref_date: refDate, p_periodo: per }; if (profId) params.p_profissional_id = profId; const { data, error } = await supabase.rpc('get_dashboard_period', params); if (error) throw error; setMetricsPeriodoData(data); } catch { setMetricsPeriodoData(null); } finally { setMetricsPeriodoLoading(false); }
  };

  useEffect(() => { if (!negocio?.id || !hoje) return; loadHoje(negocio.id, parceiroProfissional?.id ?? null); }, [negocio?.id, hoje, parceiroProfissional?.id]);
  useEffect(() => { if (!negocio?.id || !faturamentoData) return; loadDia(negocio.id, faturamentoData, parceiroProfissional?.id ?? null); }, [negocio?.id, faturamentoData, parceiroProfissional?.id]);
  useEffect(() => { if (!negocio?.id || !hoje) return; loadPeriodo(negocio.id, hoje, faturamentoPeriodo, parceiroProfissional?.id ?? null); }, [negocio?.id, hoje, faturamentoPeriodo, parceiroProfissional?.id]);

  const fetchHistoricoPage = useCallback(async ({ negocioId, profIds, date, page, append }) => {
    const from = page * AG_PAGE_SIZE; const to = from + AG_PAGE_SIZE - 1;
    const { data, error: qErr } = await supabase.from('agendamentos')
      .select(`*, preco_final, data, horario_inicio, horario_fim, entregas (nome, preco, preco_promocional), profissionais (id, nome), cliente:users!agendamentos_cliente_id_fkey (id, nome, avatar_path, type)`)
      .eq('negocio_id', negocioId).in('profissional_id', profIds).eq('data', date)
      .order('horario_inicio', { ascending: true }).order('id', { ascending: true }).range(from, to);
    if (qErr) throw qErr;
    const rows = (data || []).map(a => ({ ...a, data: a?.data ?? null, horario_inicio: a?.horario_inicio ?? null, horario_fim: a?.horario_fim ?? null }));
    setHistoricoAgendamentos(prev => { const next = append ? [...prev, ...rows] : rows; const seen = new Set(); return next.filter(a => seen.has(a.id) ? false : (seen.add(a.id), true)); });
    setHistoricoHasMore(rows.length === AG_PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (!agProfIds?.length || !historicoData) return;
    const ids = parceiroProfissional ? [parceiroProfissional.id] : agProfIds;
    setHistoricoPage(0); setHistoricoHasMore(false); setHistoricoAgendamentos([]);
    fetchHistoricoPage({ negocioId: negocio?.id, profIds: ids, date: historicoData, page: 0, append: false });
  }, [historicoData, agProfIds, parceiroProfissional?.id, fetchHistoricoPage]);

  const loadMoreHistorico = async () => {
    if (historicoLoadingMore || !historicoHasMore || !negocio?.id || !agProfIds?.length) return;
    const ids = parceiroProfissional ? [parceiroProfissional.id] : agProfIds;
    try { setHistoricoLoadingMore(true); const nextPage = historicoPage + 1; await fetchHistoricoPage({ negocioId: negocio.id, profIds: ids, date: historicoData, page: nextPage, append: true }); setHistoricoPage(nextPage); } catch { } finally { setHistoricoLoadingMore(false); }
  };

  const reloadNegocio = useCallback(async () => {
    if (!negocio?.id) return;
    const { data, error: err } = await supabase.from('negocios').select('*').eq('id', negocio.id).maybeSingle();
    if (err || !data) return;
    setNegocio(data);
    setFormInfo({ nome: data.nome || '', descricao: data.descricao || '', telefone: data.telefone || '', endereco: data.endereco || '', instagram: data.instagram || '', facebook: data.facebook || '', tema: data.tema || 'dark' });
  }, [negocio?.id]);

  const reloadProfissionais = useCallback(async (negocioId) => {
    const id = negocioId || negocio?.id; if (!id) return;
    const { data, error: err } = await supabase.rpc('get_profissionais_com_status', { p_negocio_id: id });
    if (err) return; const profs = data || []; setProfissionais(profs); return profs;
  }, [negocio?.id]);

  const reloadEntregas = useCallback(async (negocioId, profIds) => {
    const id = negocioId || negocio?.id; const ids = profIds || agProfIds; if (!id || !ids?.length) return;
    const { data, error: err } = await supabase.from('entregas').select('*, profissionais (id, nome)').eq('negocio_id', id).in('profissional_id', ids).order('created_at', { ascending: false });
    if (err) return; setEntregas(data || []);
  }, [negocio?.id, agProfIds]);

  const reloadGaleria = useCallback(async (negocioId) => {
    const id = negocioId || negocio?.id; if (!id) return;
    const { data } = await supabase.from('galerias').select('id, path, ordem').eq('negocio_id', id).order('ordem', { ascending: true }).order('created_at', { ascending: true });
    setGaleriaItems(data || []);
  }, [negocio?.id]);

  const loadData = useCallback(async (dataRef) => {
    if (!user?.id) { setError('Sessao invalida. Faca login novamente.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const negocioIdFromState = location?.state?.negocioId || null;
      const { count: ownerCount, error: ownerCountErr } = await supabase.from('negocios').select('id', { count: 'exact', head: true }).eq('owner_id', user.id);
      if (ownerCountErr) throw ownerCountErr;
      const totalOwnerBusinesses = Number(ownerCount || 0);
      setOwnerBusinessCount(totalOwnerBusinesses);
      let negocioData = null;
      if (negocioIdFromState) {
        const { data, error } = await supabase.from('negocios').select('*').eq('id', negocioIdFromState).maybeSingle();
        if (error) throw error; negocioData = data || null;
      } else if (totalOwnerBusinesses > 0) {
        if (totalOwnerBusinesses > 1) { navigate('/selecionar-negocio', { replace: true }); setLoading(false); return; }
        const { data, error } = await supabase.from('negocios').select('*').eq('owner_id', user.id).maybeSingle();
        if (error) throw error; negocioData = data || null;
      } else {
        const { data: vinculos, error: vinculosErr } = await supabase.from('profissionais').select('negocio_id').eq('user_id', user.id).eq('status', 'ativo');
        if (vinculosErr) throw vinculosErr;
        const negocioIds = [...new Set((vinculos || []).map(v => v.negocio_id).filter(Boolean))];
        if (negocioIds.length > 1) { navigate('/selecionar-negocio', { replace: true }); setLoading(false); return; }
        if (negocioIds.length === 1) { const { data, error } = await supabase.from('negocios').select('*').eq('id', negocioIds[0]).maybeSingle(); if (error) throw error; negocioData = data || null; }
      }
      if (!negocioData) { setNegocio(null); setProfissionais([]); setEntregas([]); setAgendamentos([]); setError('Nenhum negocio cadastrado.'); setLoading(false); return; }
      setNegocio(negocioData);
      setFormInfo({ nome: negocioData.nome || '', descricao: negocioData.descricao || '', telefone: negocioData.telefone || '', endereco: negocioData.endereco || '', instagram: negocioData.instagram || '', facebook: negocioData.facebook || '', tema: negocioData.tema || 'dark' });
      const [galeriaResult, profissionaisResult] = await Promise.all([
        supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocioData.id).order('ordem', { ascending: true }).order('created_at', { ascending: true }),
        supabase.rpc('get_profissionais_com_status', { p_negocio_id: negocioData.id })
      ]);
      if (galeriaResult.error) { await uiAlert('dashboard.gallery_load_warning', 'warning'); }
      setGaleriaItems(galeriaResult.data || []);
      if (profissionaisResult.error) throw profissionaisResult.error;
      const profs = profissionaisResult.data || [];
      setProfissionais(profs);
      const souDonoDoNegocio = negocioData.owner_id === user.id;
      const meuProfissional = souDonoDoNegocio ? null : (profs.find(p => p.user_id === user.id) || null);
      if (!souDonoDoNegocio && !meuProfissional) { setNegocio(null); setParceiroProfissional(null); setProfissionais([]); setEntregas([]); setAgendamentos([]); setGaleriaItems([]); setError('Você não tem acesso a este negócio.'); setLoading(false); return; }
      setParceiroProfissional(meuProfissional);
      const profId = meuProfissional?.id ?? null;
      if (profs.length === 0) { setEntregas([]); setAgendamentos([]); setLoading(false); return; }
      const ids = profs.map(p => p.id);
      const dataHoje = (typeof dataRef === 'string' && dataRef) ? dataRef : String(serverNow?.date || hoje || '');
      const [entregasResult, agendamentosResult] = await Promise.all([
        supabase.from('entregas').select('*, profissionais (id, nome)').eq('negocio_id', negocioData.id).in('profissional_id', ids).order('created_at', { ascending: false }),
        dataHoje ? supabase.from('agendamentos').select(`*, preco_final, data, horario_inicio, horario_fim, entregas (nome, preco, preco_promocional), profissionais (id, nome), cliente:users!agendamentos_cliente_id_fkey (id, nome, avatar_path, type)`).eq('negocio_id', negocioData.id).in('profissional_id', ids).gte('data', dataHoje).order('data', { ascending: true }).order('horario_inicio', { ascending: true }).order('id', { ascending: true }) : Promise.resolve({ data: [], error: null })
      ]);
      if (entregasResult.error) throw entregasResult.error;
      setEntregas(entregasResult.data || []);
      if (agendamentosResult.error) throw agendamentosResult.error;
      setAgendamentos((agendamentosResult.data || []).map(a => ({ ...a, data: a?.data ?? null, horario_inicio: a?.horario_inicio ?? null, horario_fim: a?.horario_fim ?? null })));
      if (dataHoje) { loadHoje(negocioData.id, profId); loadDia(negocioData.id, dataHoje, profId); loadPeriodo(negocioData.id, dataHoje, faturamentoPeriodo, profId); }
    } catch (e) { setError(e?.message || 'Erro inesperado.'); }
    finally { setLoading(false); }
  }, [user?.id, location?.state?.negocioId, serverNow, hoje, faturamentoPeriodo]);

  // ── Actions (100% idênticas ao original) ────────────────────────────────
  const cadastrarAdminComoProfissional = async () => {
    if (!negocio?.id || !user?.id || submittingAdminProf) return;
    try { setSubmittingAdminProf(true); const { data: userData, error: userErr } = await supabase.from('users').select('nome').eq('id', user.id).maybeSingle(); if (userErr) throw userErr; const nome = String(userData?.nome || '').trim() || 'PROFISSIONAL'; const { error: insErr } = await supabase.from('profissionais').insert([{ negocio_id: negocio.id, user_id: user.id, nome, status: 'ativo' }]); if (insErr) throw insErr; await uiAlert('dashboard.professional_updated', 'success'); await reloadProfissionais(); } catch { await uiAlert('dashboard.professional_update_error', 'error'); } finally { setSubmittingAdminProf(false); }
  };
  const uploadLogoNegocio = async (file) => {
    if (!file || !user?.id) return; if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning'); if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error');
    try { setLogoUploading(true); const ext = getImageExt(file); if (!ext) throw new Error('Formato invalido.'); const filePath = `${negocio.id}/logo.${ext}`; const { error: upErr } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true, contentType: file.type }); if (upErr) throw upErr; const { error: dbErr } = await supabase.from('negocios').update({ logo_path: `logos/${filePath}` }).eq('id', negocio.id).eq('owner_id', user.id); if (dbErr) throw dbErr; await uiAlert('dashboard.logo_updated', 'success'); await reloadNegocio(); } catch { await uiAlert('dashboard.logo_update_error', 'error'); } finally { setLogoUploading(false); }
  };
  const salvarInfoNegocio = async () => {
    if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error'); if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    try { setInfoSaving(true); const endereco = String(formInfo.endereco || '').trim(); if (endereco && !isEnderecoPadrao(endereco)) throw new Error('Endereco fora do padrao.'); const payload = { nome: String(formInfo.nome || '').trim(), descricao: String(formInfo.descricao || '').trim(), telefone: String(formInfo.telefone || '').trim(), endereco, instagram: String(formInfo.instagram || '').trim() || null, facebook: String(formInfo.facebook || '').trim() || null, tema: formInfo.tema || 'dark' }; const { error: updErr } = await supabase.from('negocios').update(payload).eq('id', negocio.id).eq('owner_id', user.id); if (updErr) throw updErr; await uiAlert('dashboard.business_info_updated', 'success'); await reloadNegocio(); } catch (e) { if (String(e?.message || '').includes('padrao')) await uiAlert('dashboard.address_format_invalid', 'error'); else await uiAlert('dashboard.business_info_update_error', 'error'); } finally { setInfoSaving(false); }
  };
  const salvarTema = async (novoTema) => {
    if (!negocio?.id) return; if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning'); setFormInfo(prev => ({ ...prev, tema: novoTema }));
    try { setTemaSaving(true); const { error: updErr } = await supabase.from('negocios').update({ tema: novoTema }).eq('id', negocio.id).eq('owner_id', user.id); if (updErr) throw updErr; setNegocio(prev => prev ? { ...prev, tema: novoTema } : prev); } catch { setFormInfo(prev => ({ ...prev, tema: negocio?.tema || 'dark' })); await uiAlert('dashboard.business_info_update_error', 'error'); } finally { setTemaSaving(false); }
  };
  const uploadGaleria = async (files) => {
    if (!files?.length || !negocio?.id) return; if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning'); const okTypes = ['image/png', 'image/jpeg', 'image/webp'];
    try { setGalleryUploading(true); for (const file of Array.from(files)) { if (!okTypes.includes(file.type)) { await uiAlert('dashboard.gallery_invalid_format', 'error'); continue; } if (file.size > 4 * 1024 * 1024) { await uiAlert('dashboard.gallery_too_large', 'error'); continue; } const ext = getImageExt(file); if (!ext) { await uiAlert('dashboard.gallery_invalid_format', 'error'); continue; } const filePath = `${negocio.id}/${crypto.randomUUID()}.${ext}`; const { error: upErr } = await supabase.storage.from('galerias').upload(filePath, file, { contentType: file.type }); if (upErr) { await uiAlert('dashboard.gallery_upload_error', 'error'); continue; } const { error: dbErr } = await supabase.from('galerias').insert({ negocio_id: negocio.id, path: `galerias/${filePath}` }); if (dbErr) await uiAlert('dashboard.gallery_upload_error', 'error'); } await uiAlert('dashboard.gallery_updated', 'success'); await reloadGaleria(); } catch { await uiAlert('dashboard.gallery_update_error', 'error'); } finally { setGalleryUploading(false); }
  };
  const removerImagemGaleria = async (item) => {
    if (!negocio?.id) return; if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning'); const ok = await uiConfirm('dashboard.gallery_remove_confirm', 'warning'); if (!ok) return;
    try { const { error: dbErr } = await supabase.from('galerias').delete().eq('id', item.id); if (dbErr) throw dbErr; setGaleriaItems(prev => prev.filter(x => x.id !== item.id)); await uiAlert('dashboard.gallery_image_removed', 'success'); } catch { await uiAlert('dashboard.gallery_remove_error', 'error'); }
  };
  const createEntrega = async (e) => {
    e.preventDefault(); if (submittingEntrega) return;
    try { setSubmittingEntrega(true); if (!negocio?.id) throw new Error('Erro ao carregar o negocio'); const profId = formEntrega.profissional_id; if (!await checarPermissao(profId)) return; const preco = toNumberOrNull(formEntrega.preco); const promo = toNumberOrNull(formEntrega.preco_promocional); if (preco == null) throw new Error('Preco invalido.'); if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.'); const payload = { nome: toUpperClean(formEntrega.nome), profissional_id: profId, duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos), preco, preco_promocional: promo, ativo: true, negocio_id: negocio.id }; if (!payload.nome) throw new Error('Nome da entrega e obrigatorio.'); if (!payload.profissional_id) throw new Error('Selecione um profissional.'); if (!payload.duracao_minutos) throw new Error('Duracao invalida.'); const { error: insErr } = await supabase.from('entregas').insert([payload]); if (insErr) throw insErr; await uiAlert(`dashboard.business.${businessGroup}.service_created`, 'success'); setShowNovaEntrega(false); setEditingEntregaId(null); setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' }); await reloadEntregas(); } catch (e2) { const msg = String(e2?.message || ''); if (msg.includes('oferta')) await uiAlert('dashboard.service_promo_invalid', 'error'); else if (msg.includes('invalido')) await uiAlert('dashboard.service_price_invalid', 'error'); else if (msg.includes('Duracao')) await uiAlert('dashboard.service_duration_invalid', 'error'); else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.service_prof_required`, 'error'); else await uiAlert(`dashboard.business.${businessGroup}.service_create_error`, 'error'); } finally { setSubmittingEntrega(false); }
  };
  const updateEntrega = async (e) => {
    e.preventDefault(); if (submittingEntrega) return;
    try { setSubmittingEntrega(true); const profId = formEntrega.profissional_id; if (!await checarPermissao(profId)) return; const preco = toNumberOrNull(formEntrega.preco); const promo = toNumberOrNull(formEntrega.preco_promocional); if (!toUpperClean(formEntrega.nome)) throw new Error('Nome da entrega e obrigatorio.'); if (!profId) throw new Error('Selecione um profissional.'); if (!toNumberOrNull(formEntrega.duracao_minutos)) throw new Error('Duracao invalida.'); if (preco == null) throw new Error('Preco invalido.'); if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.'); const payload = { nome: toUpperClean(formEntrega.nome), duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos), preco, preco_promocional: promo, profissional_id: profId }; const { error: updErr } = await supabase.from('entregas').update(payload).eq('id', editingEntregaId).eq('negocio_id', negocio.id); if (updErr) throw updErr; await uiAlert(`dashboard.business.${businessGroup}.service_updated`, 'success'); setShowNovaEntrega(false); setEditingEntregaId(null); setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' }); await reloadEntregas(); } catch (e2) { const msg = String(e2?.message || ''); if (msg.includes('oferta')) await uiAlert('dashboard.service_promo_invalid', 'error'); else if (msg.includes('invalido')) await uiAlert('dashboard.service_price_invalid', 'error'); else if (msg.includes('Duracao')) await uiAlert('dashboard.service_duration_invalid', 'error'); else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.service_prof_required`, 'error'); else await uiAlert(`dashboard.business.${businessGroup}.service_update_error`, 'error'); } finally { setSubmittingEntrega(false); }
  };
  const deleteEntrega = async (entrega) => {
    if (!await checarPermissao(entrega.profissional_id)) return; const ok = await uiConfirm(`dashboard.business.${businessGroup}.service_delete_confirm`, 'warning'); if (!ok) return;
    try { const { error: delErr } = await supabase.from('entregas').delete().eq('id', entrega.id).eq('negocio_id', negocio.id); if (delErr) throw delErr; await uiAlert(`dashboard.business.${businessGroup}.service_deleted`, 'success'); await reloadEntregas(); } catch { await uiAlert(`dashboard.business.${businessGroup}.service_delete_error`, 'error'); }
  };
  const toggleStatusProfissional = async (p) => {
    if (!await checarPermissao(p.id)) return;
    try { const novoStatus = p.status === 'ativo' ? 'inativo' : 'ativo'; let motivo = null; if (novoStatus === 'inativo') { const r = await uiPrompt('dashboard.professional_inactivate_reason', { variant: 'warning' }); if (r === null) return; motivo = r || null; } const { error: upErr } = await supabase.from('profissionais').update({ status: novoStatus, motivo_inativo: novoStatus === 'ativo' ? null : motivo }).eq('id', p.id).eq('negocio_id', negocio.id); if (upErr) throw upErr; await uiAlert(novoStatus === 'ativo' ? 'dashboard.professional_activated' : 'dashboard.professional_inactivated', 'success'); await reloadProfissionais(); } catch { await uiAlert('dashboard.professional_toggle_error', 'error'); }
  };
  const excluirProfissional = async (p) => {
    if (!await checarPermissao(p.id)) return; const ok = await uiConfirm('dashboard.professional_delete_confirm', 'warning'); if (!ok) return;
    try { const { error: delErr } = await supabase.from('profissionais').delete().eq('id', p.id).eq('negocio_id', negocio.id); if (delErr) throw delErr; await uiAlert('dashboard.professional_deleted', 'success'); const profs = await reloadProfissionais(); if (profs?.length) await reloadEntregas(negocio.id, profs.map(p => p.id)); else setEntregas([]); } catch { await uiAlert('dashboard.professional_delete_error', 'error'); }
  };
  const updateProfissional = async (e) => {
    e.preventDefault(); if (submittingProfissional) return;
    try { setSubmittingProfissional(true); if (!await checarPermissao(editingProfissionalId)) return; const payload = { nome: String(formProfissional.nome || '').trim(), profissao: String(formProfissional.profissao || '').trim() || null, anos_experiencia: formProfissional.anos_experiencia !== '' ? Number(formProfissional.anos_experiencia) : null, horario_inicio: formProfissional.horario_inicio || '08:00', horario_fim: formProfissional.horario_fim || '18:00', almoco_inicio: formProfissional.almoco_inicio || null, almoco_fim: formProfissional.almoco_fim || null, dias_trabalho: formProfissional.dias_trabalho }; if (!payload.nome) throw new Error('Nome obrigatorio.'); const { error: updErr } = await supabase.from('profissionais').update(payload).eq('id', editingProfissionalId).eq('negocio_id', negocio.id); if (updErr) throw updErr; await uiAlert('dashboard.professional_updated', 'success'); setShowEditProfissional(false); setEditingProfissionalId(null); await reloadProfissionais(); } catch (e) { const msg = String(e?.message || ''); if (msg.includes('profissional_almoco_bloqueado')) await uiAlert('dashboard.professional_almoco_blocked', 'error'); else if (msg.includes('profissional_dia_bloqueado')) await uiAlert('dashboard.professional_dia_blocked', 'error'); else await uiAlert('dashboard.professional_update_error', 'error'); } finally { setSubmittingProfissional(false); }
  };
  const aprovarParceiro = async (prof) => {
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    try { const { error } = await supabase.from('profissionais').update({ status: 'ativo' }).eq('id', prof.id).eq('negocio_id', negocio.id); if (error) throw error; await uiAlert('dashboard.professional_approved', 'success'); await reloadProfissionais(); } catch { await uiAlert('dashboard.partner_approve_error', 'error'); }
  };
  const confirmarAtendimento = async (a) => {
    if (!await checarPermissao(a.profissional_id)) return;
    try { const { error: updErr } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', a.id).eq('negocio_id', negocio.id); if (updErr) throw updErr; await uiAlert('dashboard.booking_confirmed', 'success'); await reloadAgendamentos(); loadHoje(negocio.id, parceiroProfissional?.id ?? null); } catch { await uiAlert('dashboard.booking_confirm_error', 'error'); }
  };
  const cancelarAgendamento = async (a) => {
    if (!await checarPermissao(a.profissional_id)) return; const ok = await uiConfirm('dashboard.booking_cancel_confirm', 'warning'); if (!ok) return;
    try { const { error } = await supabase.rpc('cancelar_agendamento_profissional', { p_agendamento_id: a.id }); if (error) throw error; await uiAlert('dashboard.booking_canceled', 'error'); await reloadAgendamentos(); loadHoje(negocio.id, parceiroProfissional?.id ?? null); } catch { await uiAlert('dashboard.booking_cancel_error', 'error'); }
  };
  const salvarEmail = async () => {
    const email = String(novoEmail || '').trim(); if (!email || !email.includes('@')) { await uiAlert('dashboard.account_email_invalid', 'error'); return; }
    try { setSavingDados(true); const { error: updErr } = await supabase.auth.updateUser({ email }); if (updErr) throw updErr; await uiAlert('dashboard.account_email_update_sent', 'success'); } catch { await uiAlert('dashboard.account_email_update_error', 'error'); } finally { setSavingDados(false); }
  };
  const salvarSenha = async () => {
    const pass = String(novaSenha || ''); const conf = String(confirmarSenha || ''); if (pass.length < 6) { await uiAlert('dashboard.account_password_too_short', 'error'); return; } if (pass !== conf) { await uiAlert('dashboard.account_password_mismatch', 'error'); return; }
    try { setSavingDados(true); const { error: updErr } = await supabase.auth.updateUser({ password: pass }); if (updErr) throw updErr; setNovaSenha(''); setConfirmarSenha(''); await uiAlert('dashboard.account_password_updated', 'success'); } catch { await uiAlert('dashboard.account_password_update_error', 'error'); } finally { setSavingDados(false); }
  };

  // ── Computed (100% idêntico ao original) ─────────────────────────────────
  const agendamentosHoje = useMemo(() => { const base = agendamentos.filter(a => sameDay(getAgDate(a), hoje)); if (!parceiroProfissional) return base; return base.filter(a => a.profissional_id === parceiroProfissional.id); }, [agendamentos, hoje, parceiroProfissional?.id]);
  const hojeValidos    = useMemo(() => agendamentosHoje.filter(a => !isCancelStatus(a.status)), [agendamentosHoje]);
  const hojeCancelados = useMemo(() => agendamentosHoje.filter(a => isCancelStatus(a.status)), [agendamentosHoje]);
  const proximoAgendamento = useMemo(() => { const nowMin = Number(serverNow?.minutes || 0); return hojeValidos.filter(a => timeToMinutes(getAgInicio(a) || '00:00') >= nowMin).sort((a, b) => String(getAgInicio(a)).localeCompare(String(getAgInicio(b))))[0] || null; }, [hojeValidos, serverNow?.minutes]);
  const agendamentosAgrupadosPorProfissional = useMemo(() => { const fonte = parceiroProfissional ? agendamentos.filter(a => a.profissional_id === parceiroProfissional.id) : agendamentos; const map = new Map(); for (const a of fonte) { const pid = a.profissional_id || a.profissionais?.id || 'sem-prof'; const nome = a.profissionais?.nome || 'PROFISSIONAL'; if (!map.has(pid)) map.set(pid, { pid, nome, itens: [] }); map.get(pid).itens.push(a); } const grupos = Array.from(map.values()).map(gr => ({ ...gr, itens: gr.itens.slice().sort((a, b) => { const d = String(getAgDate(a) || '').localeCompare(String(getAgDate(b) || '')); if (d !== 0) return d; const h = String(getAgInicio(a) || '').localeCompare(String(getAgInicio(b) || '')); if (h !== 0) return h; return String(a.id || '').localeCompare(String(b.id || '')); }) })); const ordem = new Map((profissionais || []).map((p, idx) => [p.id, idx])); grupos.sort((a, b) => (ordem.get(a.pid) ?? 9999) - (ordem.get(b.pid) ?? 9999)); return grupos; }, [agendamentos, profissionais, parceiroProfissional?.id]);
  const entregasPorProf = useMemo(() => { const map = new Map(); for (const p of profissionais) map.set(p.id, []); for (const s of entregas) { if (!map.has(s.profissional_id)) map.set(s.profissional_id, []); map.get(s.profissional_id).push(s); } return map; }, [profissionais, entregas]);
  const faturamentoPorProfissionalHoje   = useMemo(() => { const arr = metricsHoje?.today?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsHoje]);
  const faturamentoPorProfissionalFiltro = useMemo(() => { const arr = metricsDia?.selected_day?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsDia]);

  const tabs = parceiroProfissional
    ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais']
    : souDono
      ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais', 'info-negocio']
      : ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais'];
  const TAB_LABELS = { 'visao-geral': 'Geral', 'agendamentos': 'Agendamentos', 'cancelados': 'Cancelados', 'historico': 'Histórico', 'entregas': tabEntregasLabel, 'profissionais': 'Profissionais', 'info-negocio': 'Info do negócio' };

  // ── Loading / Error screens ───────────────────────────────────────────────
  if (loading) return (
    <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{DS}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{ fontSize: 12, letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>Carregando</div>
      </div>
    </div>
  );

  if (error || !negocio) return (
    <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{DS}</style>
      <div className="d-card" style={{ maxWidth: 420, width: '100%', padding: 40, textAlign: 'center' }}>
        <AlertCircle style={{ width: 40, height: 40, color: '#fca5a5', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 8 }}>Erro ao carregar</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>{error || 'Negócio inexistente'}</p>
        <button onClick={reloadFull} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>Tentar novamente</button>
        <button onClick={onLogout} className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>Sair</button>
      </div>
    </div>
  );

  const logoUrl = getPublicUrl('logos', negocio.logo_path);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dash-root">
      <style>{DS}</style>

      {/* Ticker */}
      <div className="d-ticker">
        <div className="d-ticker-inner">
          {[1,2].map(i => (
            <span key={i} aria-hidden={i===2} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {['VER VITRINE','SUPORTE','AGENDAMENTOS','FATURAMENTO','EQUIPE'].map((t,j) => (
                <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 20, margin: '0 20px' }}>
                  {t === 'VER VITRINE'
                    ? <Link to={`/v/${negocio.slug}`} target="_blank" style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--muted)', textDecoration: 'none' }}>{t}</Link>
                    : t === 'SUPORTE'
                      ? <a href={SUPORTE_HREF} target="_blank" rel="noreferrer" style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--muted)', textDecoration: 'none' }}>{t}</a>
                      : <span style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--muted)' }}>{t}</span>
                  }
                  <span style={{ color: 'rgba(255,255,255,.1)', fontSize: 10 }}>·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <header className="d-nav">
        <div className="d-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Award style={{ width: 18, height: 18, color: 'var(--gold)' }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{negocio.nome}</div>
              {souDono
                ? ownerBusinessCount > 1
                  ? <button type="button" onClick={() => navigate('/selecionar-negocio')} style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Trocar negócio</button>
                  : <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Dashboard</span>
                : <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>{parceiroProfissional?.nome || 'Parceiro'}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to={`/v/${negocio.slug}`} target="_blank" className="btn-outline" style={{ display: 'none' }}>
              <Eye style={{ width: 14, height: 14 }} /> Ver vitrine
            </Link>
            <style>{`@media(min-width:640px){.dash-vitrine-btn{display:inline-flex!important}}`}</style>
            <Link to={`/v/${negocio.slug}`} target="_blank" className="btn-outline dash-vitrine-btn" style={{ display: 'none' }}>
              <Eye style={{ width: 14, height: 14 }} /> Ver vitrine
            </Link>

            {souDono && (
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => uploadLogoNegocio(e.target.files?.[0])} disabled={logoUploading} />
                <span className="btn-outline" style={{ cursor: logoUploading ? 'not-allowed' : 'pointer', opacity: logoUploading ? .5 : 1 }}>
                  {logoUploading ? 'Enviando…' : 'Logo'}
                </span>
              </label>
            )}
            <button onClick={onLogout} className="btn-danger" style={{ gap: 6 }}>
              <LogOut style={{ width: 14, height: 14 }} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 32 }}>
          {/* Faturamento hoje */}
          <div className="d-card d-card-gold" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Faturamento hoje</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: 'var(--gold)' }}>
              {metricsHojeLoading ? <span style={{ color: 'var(--muted)', fontSize: 16 }}>—</span> : `R$ ${Number(metricsHoje?.today?.faturamento || 0).toFixed(2)}`}
            </div>
          </div>
          <div className="d-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Agendamentos hoje</div>
            <div style={{ fontSize: 28, fontWeight: 300 }}>{hojeValidos.length}</div>
          </div>
          <div className="d-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Profissionais</div>
            <div style={{ fontSize: 28, fontWeight: 300 }}>{profissionais.length}</div>
          </div>
          <div className="d-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>{tabEntregasLabel}</div>
            <div style={{ fontSize: 28, fontWeight: 300 }}>{entregas.length}</div>
          </div>
        </div>

        {/* Tabs container */}
        <div className="d-card" style={{ overflow: 'hidden' }}>
          <div className="d-tabs">
            {tabs.map(tab => {
              const notif = tab === 'agendamentos' ? notifAgendamentos : tab === 'cancelados' ? notifCancelados : 0;
              return (
                <button key={tab} className={`d-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => { setActiveTab(tab); if (tab === 'agendamentos') setNotifAgendamentos(0); if (tab === 'cancelados') setNotifCancelados(0); }}
                  style={{ position: 'relative' }}>
                  {TAB_LABELS[tab]}
                  {notif > 0 && <span className="notif-dot">{notif > 99 ? '99+' : notif}</span>}
                </button>
              );
            })}
          </div>

          <div style={{ padding: '28px 24px' }}>

            {/* ── VISÃO GERAL ── */}
            {activeTab === 'visao-geral' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                  <div className="d-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Cancelamentos hoje</div>
                    <div style={{ fontSize: 24, fontWeight: 300 }}>{Number(metricsHoje?.today?.cancelados || 0)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Taxa: <span style={{ color: 'var(--gold)' }}>{Number(metricsHoje?.today?.taxa_cancelamento || 0).toFixed(1)}%</span></div>
                  </div>
                  <div className="d-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Concluídos hoje</div>
                    <div style={{ fontSize: 24, fontWeight: 300 }}>{Number(metricsHoje?.today?.concluidos || 0)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Ticket médio: <span style={{ color: 'var(--gold)' }}>R$ {Number(metricsHoje?.today?.ticket_medio || 0).toFixed(2)}</span></div>
                  </div>
                  <div className="d-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Próximo</div>
                    {proximoAgendamento ? (
                      <>
                        <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--gold)' }}>{getAgInicio(proximoAgendamento)}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{proximoAgendamento.cliente?.nome || '—'} · {proximoAgendamento.profissionais?.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{proximoAgendamento.entregas?.nome}</div>
                      </>
                    ) : <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nenhum</div>}
                  </div>
                </div>

                {souDono && faturamentoPorProfissionalHoje.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                    {faturamentoPorProfissionalHoje.map(([nome, valor]) => (
                      <div key={String(nome)} className="d-card" style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Profissional</div>
                        <div style={{ fontSize: 13 }}>{String(nome || '—')}</div>
                        <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--gold)', marginTop: 4 }}>R$ {Number(valor || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Faturamento por dia */}
                <div className="d-card d-card-gold" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Faturamento</div>
                    <DatePicker value={faturamentoData} onChange={(iso) => setFaturamentoData(iso)} todayISO={hoje} />
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 300, marginBottom: 16 }}>
                    {metricsDiaLoading ? <span style={{ color: 'var(--muted)', fontSize: 20 }}>—</span> : `R$ ${Number(metricsDia?.selected_day?.faturamento || 0).toFixed(2)}`}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Concluídos', val: Number(metricsDia?.selected_day?.concluidos || 0), c: '#86efac' },
                      { label: 'Cancelados', val: Number(metricsDia?.selected_day?.cancelados || 0), c: '#fca5a5' },
                      { label: 'Fechamento', val: `${Number(metricsDia?.selected_day?.taxa_conversao || 0).toFixed(1)}%`, c: 'var(--text)' },
                      { label: 'Ticket médio', val: `R$ ${Number(metricsDia?.selected_day?.ticket_medio || 0).toFixed(2)}`, c: 'var(--gold)' },
                    ].map(({ label, val, c }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px' }}>
                        <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 300, color: c }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {souDono && faturamentoPorProfissionalFiltro.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 16 }}>
                      {faturamentoPorProfissionalFiltro.map(([nome, valor]) => (
                        <div key={String(nome)} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Profissional</div>
                          <div style={{ fontSize: 13 }}>{String(nome || '—')}</div>
                          <div style={{ fontSize: 16, fontWeight: 300, color: 'var(--gold)', marginTop: 4 }}>R$ {Number(valor || 0).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Período */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Por período</div>
                      <PeriodoSelect value={faturamentoPeriodo} onChange={setFaturamentoPeriodo} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
                      {[
                        { label: 'Concluídos', val: Number(metricsPeriodoData?.period?.concluidos || 0), c: '#86efac' },
                        { label: 'Faturamento', val: metricsPeriodoLoading ? '—' : `R$ ${Number(metricsPeriodoData?.period?.faturamento || 0).toFixed(2)}`, c: 'var(--gold)' },
                        { label: `Média por ${counterSingular.toLowerCase()}`, val: metricsPeriodoLoading ? '—' : `R$ ${Number(metricsPeriodoData?.period?.media_por_atendimento || 0).toFixed(2)}`, c: 'var(--text)' },
                      ].map(({ label, val, c }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                          <div style={{ fontSize: 18, fontWeight: 300, color: c }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── AGENDAMENTOS ── */}
            {activeTab === 'agendamentos' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 400 }}>Agendamentos</h2>
                  <button onClick={() => reloadAgendamentos()} className="btn-outline">Atualizar</button>
                </div>
                {agendamentosAgrupadosPorProfissional.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {agendamentosAgrupadosPorProfissional.map(grupo => (
                      <div key={grupo.pid}>
                        <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>{grupo.nome}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {grupo.itens.map(a => {
                            const dataA = getAgDate(a); const isFuturo = dataA > String(hoje || ''); const isHoje = dataA === String(hoje || '');
                            const st = computeStatusFromDb(a); const isCancel = isCancelStatus(st); const isDone = isDoneStatus(st); const valorReal = getValorAgendamento(a);
                            return (
                              <div key={a.id} className="d-card" style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 14 }}>{a.cliente?.nome || '—'}</span>
                                  <span className={`badge ${isCancel ? 'badge-red' : isDone ? 'badge-green' : isFuturo ? 'badge-yellow' : 'badge-blue'}`}>
                                    {isCancel ? 'Cancelado' : isDone ? 'Concluído' : isFuturo ? 'Futuro' : 'Agendado'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Prof: {a.profissionais?.nome || '—'}</div>
                                <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 12 }}>{a.entregas?.nome || '—'}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: !isDone && !isCancel ? 12 : 0 }}>
                                  {[['Data', formatDateBRFromISO(dataA)], ['Horário', getAgInicio(a)], ['Valor', `R$ ${Number(valorReal).toFixed(2)}`]].map(([l,v]) => (
                                    <div key={l}><div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13 }}>{v}</div></div>
                                  ))}
                                </div>
                                {!isDone && !isCancel && (
                                  isHoje ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                      <button onClick={() => confirmarAtendimento(a)} className="btn-success" style={{ justifyContent: 'center' }}>Confirmar</button>
                                      <button onClick={() => cancelarAgendamento(a)} className="btn-danger" style={{ justifyContent: 'center' }}>Cancelar</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => cancelarAgendamento(a)} className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>Cancelar</button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Nenhum agendamento hoje ou futuro.</p>}
              </div>
            )}

            {/* ── CANCELADOS ── */}
            {activeTab === 'cancelados' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 24 }}>Cancelados hoje</h2>
                {hojeCancelados.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {hojeCancelados.sort((a,b) => String(getAgInicio(a)).localeCompare(String(getAgInicio(b)))).map(a => {
                      const valorReal = getValorAgendamento(a);
                      return (
                        <div key={a.id} className="d-card" style={{ padding: '16px 20px', borderColor: 'rgba(239,68,68,.2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>{a.cliente?.nome || '—'}</span>
                            <span className="badge badge-red">Cancelado</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Prof: {a.profissionais?.nome || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 12 }}>{a.entregas?.nome || '—'}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                            {[['Data', formatDateBRFromISO(getAgDate(a))], ['Horário', getAgInicio(a)], ['Valor', `R$ ${Number(valorReal).toFixed(2)}`]].map(([l,v]) => (
                              <div key={l}><div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13 }}>{v}</div></div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Nenhum cancelamento hoje.</p>}
              </div>
            )}

            {/* ── HISTÓRICO ── */}
            {activeTab === 'historico' && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 400 }}>Histórico</h2>
                  <DatePicker value={historicoData} onChange={(iso) => setHistoricoData(iso)} todayISO={hoje} />
                </div>
                {historicoAgendamentos.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {historicoAgendamentos.map(a => {
                      const st = computeStatusFromDb(a); const isCancel = isCancelStatus(st); const isDone = isDoneStatus(st); const valorReal = getValorAgendamento(a);
                      return (
                        <div key={a.id} className="d-card" style={{ padding: '16px 20px', borderColor: isCancel ? 'rgba(239,68,68,.2)' : 'var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>{a.cliente?.nome || '—'}</span>
                            <span className={`badge ${isCancel ? 'badge-red' : isDone ? 'badge-green' : 'badge-blue'}`}>{isCancel ? 'Cancelado' : isDone ? 'Concluído' : 'Agendado'}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Prof: {a.profissionais?.nome || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 12 }}>{a.entregas?.nome || '—'}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                            {[['Data', formatDateBRFromISO(getAgDate(a))], ['Horário', getAgInicio(a)], ['Valor', `R$ ${Number(valorReal).toFixed(2)}`]].map(([l,v]) => (
                              <div key={l}><div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13 }}>{v}</div></div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Nenhum agendamento para essa data.</div>}
                {historicoHasMore && (
                  <button onClick={loadMoreHistorico} disabled={historicoLoadingMore} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                    {historicoLoadingMore ? 'Carregando…' : 'Carregar mais'}
                  </button>
                )}
              </div>
            )}

            {/* ── ENTREGAS ── */}
            {activeTab === 'entregas' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 400 }}>{sectionTitle}</h2>
                  <button className="btn-gold" onClick={() => { const profId = parceiroProfissional ? parceiroProfissional.id : ''; setShowNovaEntrega(true); setEditingEntregaId(null); setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: profId }); }}>
                    <Plus style={{ width: 14, height: 14 }} />{btnAddLabel}
                  </button>
                </div>
                {profissionais.length === 0
                  ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum profissional cadastrado.</p>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {profissionais.map(p => {
                        const lista = (entregasPorProf.get(p.id) || []).slice().sort((a,b) => Number(b.preco||0) - Number(a.preco||0));
                        return (
                          <div key={p.id} className="d-card" style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                              <span style={{ fontSize: 14, fontWeight: 500 }}>{p.nome}</span>
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{lista.length} {lista.length === 1 ? counterSingular : counterPlural}</span>
                            </div>
                            {lista.length ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                                {lista.map(s => {
                                  const preco = Number(s.preco ?? 0); const promo = s.preco_promocional == null ? null : Number(s.preco_promocional); const temPromo = promo != null && promo > 0 && promo < preco;
                                  return (
                                    <div key={s.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 16px' }}>
                                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                                        {temPromo
                                          ? <div><div style={{ fontSize: 18, fontWeight: 300, color: '#86efac' }}>R$ {promo.toFixed(2)}</div><div style={{ fontSize: 11, color: '#fca5a5', textDecoration: 'line-through' }}>R$ {preco.toFixed(2)}</div></div>
                                          : <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--gold)' }}>R$ {preco.toFixed(2)}</div>}
                                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{s.duracao_minutos} min</span>
                                      </div>
                                      <div style={{ fontSize: 13, marginBottom: 2 }}>{s.nome}</div>
                                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{p.nome}</div>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={async () => { if (!await checarPermissao(s.profissional_id)) return; setEditingEntregaId(s.id); setFormEntrega({ nome: s.nome||'', duracao_minutos: String(s.duracao_minutos??''), preco: String(s.preco??''), preco_promocional: String(s.preco_promocional??''), profissional_id: s.profissional_id||'' }); setShowNovaEntrega(true); }} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '6px 12px' }}>Editar</button>
                                        <button onClick={() => deleteEntrega(s)} className="btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '6px 12px' }}>Excluir</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : <p style={{ fontSize: 13, color: 'var(--muted)' }}>{emptyListMsg}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            )}

            {/* ── PROFISSIONAIS ── */}
            {activeTab === 'profissionais' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 400 }}>Profissionais</h2>
                  {souDono && !adminJaEhProfissional && (
                    <button onClick={cadastrarAdminComoProfissional} disabled={submittingAdminProf} className="btn-outline">
                      <Plus style={{ width: 14, height: 14 }} />{submittingAdminProf ? 'Cadastrando…' : 'Me cadastrar'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
                  {profissionais.map(p => {
                    const isPendente = p.status === 'pendente'; const isInativo = p.status === 'inativo'; const isAtivo = p.status === 'ativo';
                    const label = normalizeKey(p.status_label);
                    const dotColors = {
                      ABERTO: '#22c55e',
                      FECHADO: '#ef4444',
                      ALMOCO: '#facc15',
                      INATIVO: '#6b7280'
                    };
                    const dotColor = isPendente ? '#facc15' : (dotColors[label] || '#6b7280');
                    const isEuMesmo = parceiroProfissional?.id === p.id;
                    return (
                      <div key={p.id} className="d-card" style={{ padding: '20px', borderColor: isPendente ? 'rgba(234,179,8,.3)' : isEuMesmo ? 'var(--gold-line)' : 'var(--border)', position: 'relative' }}>
                        {isPendente && <span className="badge badge-yellow" style={{ position: 'absolute', top: 12, right: 12 }}>Aguardando</span>}
                        {!isPendente && isInativo && <span className="badge badge-red" style={{ position: 'absolute', top: 12, right: 12 }}>Inativo</span>}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--gold-dim)', border: '1px solid var(--gold-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 400, flexShrink: 0, color: 'var(--gold)' }}>{p.nome?.[0] || 'P'}</div>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: 56 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{p.nome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                              <span style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>{isPendente ? 'Pendente' : (p.status_label || '—')}</span>
                            </div>
                            {p.profissao && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{p.profissao}</div>}
                          </div>
                        </div>
                        {!isPendente && (
                          <>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{entregas.filter(s => s.profissional_id === p.id).length} {counterPlural}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock style={{ width: 11, height: 11 }} />{p.horario_inicio} — {p.horario_fim}
                              {p.almoco_inicio && p.almoco_fim && <span style={{ color: '#fde047', marginLeft: 4 }}>· {p.almoco_inicio} — {p.almoco_fim}</span>}
                            </div>
                          </>
                        )}
                        {isPendente && souDono && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                            <button onClick={() => aprovarParceiro(p)} className="btn-success" style={{ flex: 1, justifyContent: 'center' }}>Aprovar</button>
                            <button onClick={() => excluirProfissional(p)} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Excluir</button>
                          </div>
                        )}
                        {!isPendente && (isEuMesmo || souDono) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {isInativo && p.motivo_inativo && <div style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 4, padding: '8px 12px', marginBottom: 4 }}>Inativo{p.motivo_inativo ? ` · ${p.motivo_inativo}` : ''}</div>}
                            {souDono ? (
                              <>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => toggleStatusProfissional(p)} className={isAtivo ? 'btn-danger' : 'btn-success'} style={{ flex: 1, justifyContent: 'center' }}>{isAtivo ? 'Inativar' : 'Ativar'}</button>
                                  <button onClick={() => excluirProfissional(p)} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Excluir</button>
                                </div>
                                <button onClick={() => { setEditingProfissionalId(p.id); setFormProfissional({ nome: p.nome||'', profissao: p.profissao||'', anos_experiencia: String(p.anos_experiencia??''), horario_inicio: p.horario_inicio||'08:00', horario_fim: p.horario_fim||'18:00', almoco_inicio: p.almoco_inicio||'', almoco_fim: p.almoco_fim||'', dias_trabalho: p.dias_trabalho||[1,2,3,4,5,6] }); setShowEditProfissional(true); }} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Editar</button>
                              </>
                            ) : isEuMesmo ? (
                              <button onClick={() => { setEditingProfissionalId(p.id); setFormProfissional({ nome: p.nome||'', profissao: p.profissao||'', anos_experiencia: String(p.anos_experiencia??''), horario_inicio: p.horario_inicio||'08:00', horario_fim: p.horario_fim||'18:00', almoco_inicio: p.almoco_inicio||'', almoco_fim: p.almoco_fim||'', dias_trabalho: p.dias_trabalho||[1,2,3,4,5,6] }); setShowEditProfissional(true); }} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Editar</button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── INFO DO NEGÓCIO ── */}
            {activeTab === 'info-negocio' && souDono && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 400 }}>Info do negócio</h2>
                  <button onClick={salvarInfoNegocio} disabled={infoSaving} className="btn-gold">
                    <Save style={{ width: 14, height: 14 }} />{infoSaving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
                <div style={{ marginBottom: 4 }}><TemaToggle value={formInfo.tema} onChange={salvarTema} loading={temaSaving} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
                  {[['nome','Negócio','Nome'],['telefone','Telefone','(xx) xxxxx-xxxx']].map(([k,l,ph]) => (
                    <div key={k} className="d-card" style={{ padding: '16px 20px' }}>
                      <label className="d-label">{l}</label>
                      <input className="d-input" value={formInfo[k]} onChange={e => setFormInfo(prev => ({ ...prev, [k]: e.target.value }))} placeholder={ph} />
                    </div>
                  ))}
                  <div className="d-card" style={{ padding: '16px 20px', gridColumn: 'span 2' }}>
                    <label className="d-label">Endereço</label>
                    <input className="d-input" value={formInfo.endereco} onChange={e => setFormInfo(prev => ({ ...prev, endereco: e.target.value }))} placeholder='Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais' />
                    <div style={{ fontSize: 11, color: '#fde047', marginTop: 8 }}>Formato: "RUA, NÚMERO - CIDADE, ESTADO"</div>
                  </div>
                  <div className="d-card" style={{ padding: '16px 20px', gridColumn: 'span 2' }}>
                    <label className="d-label">Sobre</label>
                    <textarea className="d-input" value={formInfo.descricao} onChange={e => setFormInfo(prev => ({ ...prev, descricao: e.target.value }))} rows={3} placeholder="Sobre o negócio…" style={{ resize: 'none' }} />
                  </div>
                </div>
                <div className="d-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Redes sociais</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Aparecem na vitrine pública. Deixe em branco para ocultar.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                    {[['instagram','Instagram','@seuinstagram'],['facebook','Facebook','facebook.com/…']].map(([k,l,ph]) => (
                      <div key={k}><label className="d-label">{l}</label><input className="d-input" value={formInfo[k]} onChange={e => setFormInfo(prev => ({ ...prev, [k]: e.target.value }))} placeholder={ph} /></div>
                    ))}
                  </div>
                </div>
                <div className="d-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>Galeria</div>
                    <label>
                      <input type="file" accept="image/png,image/jpeg,image/webp" multiple style={{ display: 'none' }} onChange={e => uploadGaleria(e.target.files)} disabled={galleryUploading} />
                      <span className="btn-outline" style={{ cursor: galleryUploading ? 'not-allowed' : 'pointer', opacity: galleryUploading ? .5 : 1 }}>
                        <Plus style={{ width: 13, height: 13 }} />{galleryUploading ? 'Enviando…' : 'Adicionar'}
                      </span>
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Fotos do seu espaço e serviços aparecem na vitrine pública.</div>
                  {galeriaItems.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
                      {galeriaItems.map(item => (
                        <div key={item.id || item.path} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={getPublicUrl('galerias', item.path)} alt="Galeria" style={{ width: '100%', height: 96, objectFit: 'cover', display: 'block' }} />
                          <button onClick={() => removerImagemGaleria(item)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', color: '#fca5a5', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity .2s', width: '100%' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>Remover</button>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nenhuma imagem ainda.</div>}
                </div>
                <div className="d-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>Dados da conta</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                    <div>
                      <label className="d-label">Email</label>
                      <input type="email" className="d-input" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} placeholder="seu@email.com" style={{ marginBottom: 8 }} />
                      <button type="button" disabled={savingDados} onClick={salvarEmail} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Salvar email</button>
                    </div>
                    <div>
                      <label className="d-label">Nova senha</label>
                      <input type="password" className="d-input" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="••••••••" style={{ marginBottom: 8 }} />
                      <label className="d-label">Confirmar senha</label>
                      <input type="password" className="d-input" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="••••••••" style={{ marginBottom: 8 }} />
                      <button type="button" disabled={savingDados} onClick={salvarSenha} className="btn-success" style={{ width: '100%', justifyContent: 'center' }}>Salvar senha</button>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => navigate('/criar-negocio')} className="btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', borderRadius: 999 }}>
                  + Criar outro negócio
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Modal: nova/editar entrega ── */}
      {showNovaEntrega && (
        <div className="d-modal-backdrop">
          <div className="d-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 400 }}>{editingEntregaId ? modalEditLabel : modalNewLabel}</h3>
              <button onClick={() => { setShowNovaEntrega(false); setEditingEntregaId(null); setFormEntrega({ nome:'', duracao_minutos:'', preco:'', preco_promocional:'', profissional_id:'' }); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <form onSubmit={editingEntregaId ? updateEntrega : createEntrega} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="d-label">Profissional</label><ProfissionalSelect value={formEntrega.profissional_id} onChange={id => setFormEntrega({ ...formEntrega, profissional_id: id })} profissionais={parceiroProfissional ? profissionais.filter(p => p.id === parceiroProfissional.id) : profissionais} placeholder="Selecione" apenasAtivos={true} /></div>
              <div><label className="d-label">Nome</label><input type="text" className="d-input" value={formEntrega.nome} onChange={e => setFormEntrega({ ...formEntrega, nome: e.target.value })} required /></div>
              <div><label className="d-label">Duração (min)</label><input type="number" className="d-input" value={formEntrega.duracao_minutos} onChange={e => setFormEntrega({ ...formEntrega, duracao_minutos: e.target.value })} required /></div>
              <div><label className="d-label">Preço (R$)</label><input type="number" step="0.01" className="d-input" value={formEntrega.preco} onChange={e => setFormEntrega({ ...formEntrega, preco: e.target.value })} required /></div>
              <div>
                <label className="d-label">Preço de oferta (opcional)</label>
                <input type="number" step="0.01" className="d-input" value={formEntrega.preco_promocional} onChange={e => setFormEntrega({ ...formEntrega, preco_promocional: e.target.value })} placeholder="Apenas se houver oferta" />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Deve ser menor que o preço normal.</div>
              </div>
              <button type="submit" disabled={submittingEntrega} className="btn-gold" style={{ justifyContent: 'center', opacity: submittingEntrega ? .5 : 1 }}>
                {submittingEntrega ? 'Salvando…' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: editar profissional ── */}
      {showEditProfissional && (
        <div className="d-modal-backdrop">
          <div className="d-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 400 }}>Editar profissional</h3>
              <button onClick={() => { setShowEditProfissional(false); setEditingProfissionalId(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <form onSubmit={updateProfissional} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="d-label">Nome</label><input type="text" className="d-input" value={formProfissional.nome} onChange={e => setFormProfissional({ ...formProfissional, nome: e.target.value })} required /></div>
              <div><label className="d-label">Como te chamamos?</label><input type="text" className="d-input" value={formProfissional.profissao} onChange={e => setFormProfissional({ ...formProfissional, profissao: e.target.value })} placeholder="Ex: Barbeiro, Manicure…" /></div>
              <div><label className="d-label">Anos de experiência</label><input type="number" className="d-input" value={formProfissional.anos_experiencia} onChange={e => setFormProfissional({ ...formProfissional, anos_experiencia: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label className="d-label">Das</label><TimePicker value={formProfissional.horario_inicio} onChange={v => setFormProfissional({ ...formProfissional, horario_inicio: v })} step={30} /></div>
                <div><label className="d-label">Até</label><TimePicker value={formProfissional.horario_fim} onChange={v => setFormProfissional({ ...formProfissional, horario_fim: v })} step={30} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label className="d-label">Almoço início</label><TimePicker value={formProfissional.almoco_inicio} onChange={v => setFormProfissional({ ...formProfissional, almoco_inicio: v })} step={15} /></div>
                <div><label className="d-label">Almoço fim</label><TimePicker value={formProfissional.almoco_fim} onChange={v => setFormProfissional({ ...formProfissional, almoco_fim: v })} step={15} /></div>
              </div>
              <div>
                <label className="d-label">Dias de trabalho</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {WEEKDAYS.map(d => (
                    <button key={d.value} type="button"
                      onClick={() => { const dias = formProfissional.dias_trabalho.includes(d.value) ? formProfissional.dias_trabalho.filter(x => x !== d.value) : [...formProfissional.dias_trabalho, d.value].sort(); setFormProfissional({ ...formProfissional, dias_trabalho: dias }); }}
                      style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${formProfissional.dias_trabalho.includes(d.value) ? 'var(--gold-line)' : 'var(--border)'}`, background: formProfissional.dias_trabalho.includes(d.value) ? 'var(--gold-dim)' : 'transparent', color: formProfissional.dias_trabalho.includes(d.value) ? 'var(--gold)' : 'var(--muted)', fontSize: 11, letterSpacing: '.08em', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submittingProfissional} className="btn-gold" style={{ justifyContent: 'center', opacity: submittingProfissional ? .5 : 1 }}>
                {submittingProfissional ? 'Salvando…' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
