import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, X, Eye, Calendar,
  Users, TrendingUp, Award, LogOut, AlertCircle, Clock,
  Save
} from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';
import { getBusinessGroup } from '../businessTerms';
import DatePicker from '../components/DatePicker';
import PeriodoSelect from '../components/PeriodoSelect';
import ProfissionalSelect from '../components/ProfissionalSelect';
import TimePicker from '../components/TimePicker';

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

const VIEWS = {
  negocios: 'negocios',
  profissionais: 'profissionais',
  entregas: 'entregas',
  agendamentos: 'agendamentos',
};

const toNumberOrNull = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const sameDay = (a, b) => String(a || '') === String(b || '');

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

const getAgDate = (a) => String(a?.data ?? '');

const getAgInicio = (a) => {
  const v = a?.horario_inicio ?? a?.inicio ?? '';
  return String(v || '').slice(0, 5);
};

const normalizeStatus = (s) =>
  String(s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isCancelStatus = (s) => normalizeStatus(s).includes('cancelado');
const isDoneStatus = (s) => normalizeStatus(s) === 'concluido';

function computeStatusFromDb(a) {
  return String(a?.status || '');
}

const WEEKDAYS = [
  { i: 0, label: 'DOM' },
  { i: 1, label: 'SEG' },
  { i: 2, label: 'TER' },
  { i: 3, label: 'QUA' },
  { i: 4, label: 'QUI' },
  { i: 5, label: 'SEX' },
  { i: 6, label: 'SÁB' },
];

function normalizeDiasTrabalho(arr) {
  const base = Array.isArray(arr) ? arr : [];
  const cleaned = base
    .map(n => Number(n))
    .filter(n => Number.isFinite(n))
    .map(n => (n === 7 ? 0 : n))
    .filter(n => n >= 0 && n <= 6);
  return Array.from(new Set(cleaned)).sort((a, b) => a - b);
}

function formatDateBRFromISO(dateStr) {
  if (!dateStr) return 'Selecionar';
  const [y, m, d] = String(dateStr).split('-');
  if (!y || !m || !d) return String(dateStr);
  return `${d}.${m}.${y}`;
}

function getPublicUrl(bucket, path) {
  if (!bucket || !path) return null;
  try {
    const stripped = path.replace(new RegExp(`^${bucket}/`), '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(stripped);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

function ClienteAvatar({ cliente, size = 'w-9 h-9' }) {
  const avatarUrl = getPublicUrl('avatars', cliente?.avatar_path);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={cliente?.nome || ''}
        className={`${size} rounded-full object-cover border border-gray-700 shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center text-black text-sm font-normal shrink-0`}>
      {(cliente?.nome || '?')[0]}
    </div>
  );
}

function TemaToggle({ value, onChange, loading }) {
  const isLight = value === 'light';
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-normal uppercase transition-colors ${!isLight ? 'text-primary' : 'text-gray-600'}`}>DARK</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => onChange(isLight ? 'dark' : 'light')}
        aria-label="Alternar tema da vitrine"
        className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-all duration-300 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isLight ? 'bg-white border-gray-300' : 'bg-dark-200 border-gray-700'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full shadow-md transition-all duration-300 ${isLight ? 'translate-x-7 bg-gray-900' : 'translate-x-1 bg-primary'}`} />
      </button>
      <span className={`text-xs font-normal uppercase transition-colors ${isLight ? 'text-primary' : 'text-gray-600'}`}>WHITE</span>
    </div>
  );
}

const toUpperClean = (s) => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();

const isEnderecoPadrao = (s) => {
  const v = String(s || '').trim();
  return /^.+,\s*\d+.*\s-\s.+,\s.+$/.test(v);
};

function getValorEntrega(entrega) {
  const preco = Number(entrega?.preco ?? 0);
  const promoRaw = entrega?.preco_promocional;
  const promo = (promoRaw == null || promoRaw === '') ? null : Number(promoRaw);
  if (promo != null && Number.isFinite(promo) && promo > 0 && promo < preco) return promo;
  return preco;
}

function getValorAgendamento(a) {
  const frozen = Number(a?.preco_final);
  if (Number.isFinite(frozen) && frozen > 0) return frozen;
  return getValorEntrega(a?.entregas);
}

const normalizeKey = (s) =>
  String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const LABEL_TAB = {
  servicos:  'SERVIÇOS',
  consultas: 'CONSULTAS',
  aulas:     'AULAS',
};

const LABEL_SECTION = {
  servicos:  'Serviços',
  consultas: 'Consultas',
  aulas:     'Aulas',
};

const LABEL_BTN_ADD = {
  servicos:  'SERVIÇO',
  consultas: 'CONSULTA',
  aulas:     'AULA',
};

const LABEL_MODAL_NEW = {
  servicos:  'NOVO SERVIÇO',
  consultas: 'NOVA CONSULTA',
  aulas:     'NOVA AULA',
};

const LABEL_MODAL_EDIT = {
  servicos:  'EDITAR SERVIÇO',
  consultas: 'EDITAR CONSULTA',
  aulas:     'EDITAR AULA',
};

const LABEL_COUNTER_SINGULAR = {
  servicos:  'serviço',
  consultas: 'consulta',
  aulas:     'aula',
};

const LABEL_COUNTER_PLURAL = {
  servicos:  'serviços',
  consultas: 'consultas',
  aulas:     'aulas',
};

const LABEL_EMPTY_LIST = {
  servicos:  'Sem serviços para este profissional.',
  consultas: 'Sem consultas para este profissional.',
  aulas:     'Sem aulas para este profissional.',
};

const g = (map, group) => map[group] ?? map['servicos'];

export default function Dashboard({ user, onLogout }) {
  const feedback = useFeedback?.();

  const uiAlert = async (key, variant = 'info') => {
    if (feedback?.showMessage) return feedback.showMessage(key, { variant });
    return Promise.resolve();
  };

  const uiConfirm = async (key, variant = 'warning') => {
    if (feedback?.confirm) return !!(await feedback.confirm(key, { variant }));
    return false;
  };

  const uiPrompt = async (key, { variant = 'info', placeholder = '', initialValue = '' } = {}) => {
    if (feedback?.prompt) return await feedback.prompt(key, { variant, placeholder, initialValue });
    return null;
  };

  const [activeTab, setActiveTab] = useState('agendamentos');

  const [negocio, setNegocio] = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [serverNow, setServerNow] = useState(() => ({ ts: null, dow: 0, date: '', source: 'db', minutes: 0 }));
  const [hoje, setHoje] = useState(() => '');

  const [agProfIds, setAgProfIds] = useState([]);
  const [historicoAgendamentos, setHistoricoAgendamentos] = useState([]);
  const [historicoPage, setHistoricoPage] = useState(0);
  const [historicoHasMore, setHistoricoHasMore] = useState(false);
  const [historicoLoadingMore, setHistoricoLoadingMore] = useState(false);

  const [historicoData, setHistoricoData] = useState('');
  const [faturamentoData, setFaturamentoData] = useState('');
  const [faturamentoPeriodo, setFaturamentoPeriodo] = useState('7d');

  const [metricsHoje, setMetricsHoje] = useState(null);
  const [metricsDia, setMetricsDia] = useState(null);
  const [metricsPeriodoData, setMetricsPeriodoData] = useState(null);
  const [metricsHojeLoading, setMetricsHojeLoading] = useState(false);
  const [metricsDiaLoading, setMetricsDiaLoading] = useState(false);
  const [metricsPeriodoLoading, setMetricsPeriodoLoading] = useState(false);

  const [showNovaEntrega, setShowNovaEntrega] = useState(false);
  const [showNovoProfissional, setShowNovoProfissional] = useState(false);

  const [editingEntregaId, setEditingEntregaId] = useState(null);
  const [editingProfissional, setEditingProfissional] = useState(null);

  const [logoUploading, setLogoUploading] = useState(false);

  const [formEntrega, setFormEntrega] = useState({
    nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: ''
  });

  const [formProfissional, setFormProfissional] = useState({
    nome: '', profissao: '', anos_experiencia: '',
    horario_inicio: '08:00', horario_fim: '18:00',
    almoco_inicio: '', almoco_fim: '', dias_trabalho: [1, 2, 3, 4, 5, 6]
  });

  const [infoSaving, setInfoSaving] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galeriaItems, setGaleriaItems] = useState([]);

  const [formInfo, setFormInfo] = useState({
    nome: '', descricao: '', telefone: '', endereco: '', instagram: '', facebook: '', tema: 'dark',
  });
  const [temaSaving, setTemaSaving] = useState(false);

  const [novoEmail, setNovoEmail] = useState(user?.email || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingDados, setSavingDados] = useState(false);

  const [parceiroSelected, setParceiroSelected] = useState('');
  const [parceiroEmail, setParceiroEmail] = useState('');
  const [parceiroSaving, setParceiroSaving] = useState(false);

  useEffect(() => { setNovoEmail(user?.email || ''); }, [user?.email]);

  const businessGroup = useMemo(
    () => getBusinessGroup(negocio?.tipo_negocio),
    [negocio?.tipo_negocio]
  );

  const tabEntregasLabel  = g(LABEL_TAB,              businessGroup);
  const sectionTitle      = g(LABEL_SECTION,          businessGroup);
  const btnAddLabel       = g(LABEL_BTN_ADD,          businessGroup);
  const modalNewLabel     = g(LABEL_MODAL_NEW,        businessGroup);
  const modalEditLabel    = g(LABEL_MODAL_EDIT,       businessGroup);
  const counterSingular   = g(LABEL_COUNTER_SINGULAR, businessGroup);
  const counterPlural     = g(LABEL_COUNTER_PLURAL,   businessGroup);
  const emptyListMsg      = g(LABEL_EMPTY_LIST,       businessGroup);

  const fetchNowFromDb = async () => {
    const { data, error: rpcErr } = await supabase.rpc('now_sp');
    if (rpcErr) throw rpcErr;
    const payload = data?.[0]?.now_sp || data?.now_sp || data?.[0] || data;
    if (!payload || !payload.date) throw new Error('now_sp vazio');
    setServerNow(payload);
    setHoje(String(payload.date));
    return String(payload.date);
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchNowFromDb().then(dataRef => loadData(dataRef));
  }, [user?.id]);

  useEffect(() => {
    setHistoricoData(prev => (prev ? prev : hoje));
    setFaturamentoData(prev => (prev ? prev : hoje));
  }, [hoje]);

  const extractRpcPayload = (data, key) =>
    data?.[key] || data?.[0]?.[key] || data?.payload || data?.[0]?.payload || data;

  const loadHoje = async (negocioId) => {
    const id = negocioId || negocio?.id;
    if (!id) return;
    try {
      setMetricsHojeLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_today', { p_negocio_id: id });
      if (error) throw error;
      setMetricsHoje(extractRpcPayload(data, 'get_dashboard_today'));
    } catch (e) { console.error('loadHoje error:', e); setMetricsHoje(null); }
    finally { setMetricsHojeLoading(false); }
  };

  const loadDia = async (negocioId, dateISO) => {
    const id = negocioId || negocio?.id;
    const date = String(dateISO || faturamentoData || hoje || '');
    if (!id || !date) return;
    try {
      setMetricsDiaLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_day', { p_negocio_id: id, p_date: date });
      if (error) throw error;
      setMetricsDia(extractRpcPayload(data, 'get_dashboard_day'));
    } catch (e) { console.error('loadDia error:', e); setMetricsDia(null); }
    finally { setMetricsDiaLoading(false); }
  };

  const loadPeriodo = async (negocioId, refDateISO, periodo) => {
    const id = negocioId || negocio?.id;
    const refDate = String(refDateISO || hoje || '');
    const per = String(periodo || faturamentoPeriodo || '7d');
    if (!id || !refDate) return;
    try {
      setMetricsPeriodoLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_period', { p_negocio_id: id, p_ref_date: refDate, p_periodo: per });
      if (error) throw error;
      setMetricsPeriodoData(extractRpcPayload(data, 'get_dashboard_period'));
    } catch (e) { console.error('loadPeriodo error:', e); setMetricsPeriodoData(null); }
    finally { setMetricsPeriodoLoading(false); }
  };

  useEffect(() => {
    if (!negocio?.id || !hoje) return;
    loadHoje(negocio.id);
    loadDia(negocio.id, faturamentoData || hoje);
  }, [negocio?.id, hoje]);

  useEffect(() => {
    if (!negocio?.id || !faturamentoData) return;
    loadDia(negocio.id, faturamentoData);
  }, [negocio?.id, faturamentoData]);

  useEffect(() => {
    if (!negocio?.id || !hoje) return;
    loadPeriodo(negocio.id, hoje, faturamentoPeriodo);
  }, [negocio?.id, hoje, faturamentoPeriodo]);

  useEffect(() => {
    if (!agProfIds?.length || !historicoData) return;
    setHistoricoPage(0);
    setHistoricoHasMore(false);
    setHistoricoAgendamentos([]);
    fetchHistoricoPage({ negocioId: negocio?.id, profIds: agProfIds, date: historicoData, page: 0, append: false });
  }, [historicoData, agProfIds]);

  const fetchHistoricoPage = async ({ negocioId, profIds, date, page, append }) => {
    const from = page * AG_PAGE_SIZE;
    const to = from + AG_PAGE_SIZE - 1;
    const { data, error: qErr } = await supabase
      .from(VIEWS.agendamentos)
      .select(`*, preco_final, data, horario_inicio, horario_fim,
        entregas (nome, preco, preco_promocional),
        profissionais (id, nome),
        cliente:users!agendamentos_cliente_id_fkey (id, nome, avatar_path, type)`)
      .eq('negocio_id', negocioId)
      .in('profissional_id', profIds)
      .eq('data', date)
      .order('horario_inicio', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);
    if (qErr) throw qErr;
    const rows = (data || []).map(a => ({
      ...a,
      data: a?.data ?? null,
      horario_inicio: a?.horario_inicio ?? a?.inicio ?? null,
      horario_fim: a?.horario_fim ?? a?.fim ?? null,
    }));
    setHistoricoAgendamentos(prev => {
      const next = append ? [...prev, ...rows] : rows;
      const seen = new Set();
      return next.filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true)));
    });
    setHistoricoHasMore(rows.length === AG_PAGE_SIZE);
  };

  const loadMoreHistorico = async () => {
    if (historicoLoadingMore || !historicoHasMore || !negocio?.id || !agProfIds?.length) return;
    try {
      setHistoricoLoadingMore(true);
      const nextPage = historicoPage + 1;
      await fetchHistoricoPage({ negocioId: negocio.id, profIds: agProfIds, date: historicoData, page: nextPage, append: true });
      setHistoricoPage(nextPage);
    } catch (e) { console.error('loadMoreHistorico error:', e); }
    finally { setHistoricoLoadingMore(false); }
  };

  const loadData = async (dataRef) => {
    if (!user?.id) { setError('Sessao invalida. Faca login novamente.'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    if (dataRef === true) {
      try { dataRef = await fetchNowFromDb(); }
      catch (e) { dataRef = String(serverNow?.date || hoje || ''); }
    }
    try {
      const { data: negocioData, error: negocioError } = await supabase
        .from(VIEWS.negocios).select('*').eq('owner_id', user.id).maybeSingle();
      if (negocioError) throw negocioError;
      if (!negocioData) {
        setNegocio(null); setProfissionais([]); setEntregas([]); setAgendamentos([]);
        setError('Nenhum negocio cadastrado.'); setLoading(false); return;
      }
      setNegocio(negocioData);
      setFormInfo({
        nome: negocioData.nome || '', descricao: negocioData.descricao || '',
        telefone: negocioData.telefone || '', endereco: negocioData.endereco || '',
        instagram: negocioData.instagram || '', facebook: negocioData.facebook || '',
        tema: negocioData.tema || 'dark',
      });
      const [galeriaResult, profissionaisResult] = await Promise.all([
        supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocioData.id)
          .order('ordem', { ascending: true }).order('created_at', { ascending: true }),
        supabase.rpc('get_profissionais_com_status', { p_negocio_id: negocioData.id })
      ]);
      if (galeriaResult.error) console.error('Erro ao carregar galeria:', galeriaResult.error);
      setGaleriaItems(galeriaResult.data || []);
      if (profissionaisResult.error) throw profissionaisResult.error;
      const profs = profissionaisResult.data || [];
      setProfissionais(profs);
      if (profs.length === 0) { setEntregas([]); setAgendamentos([]); setLoading(false); return; }
      const ids = profs.map(p => p.id);
      setAgProfIds(ids);
      const dataHoje = (typeof dataRef === 'string' && dataRef) ? dataRef : String(serverNow?.date || hoje || '');
      const [entregasResult, agendamentosResult] = await Promise.all([
        supabase.from(VIEWS.entregas).select('*, profissionais (id, nome)')
          .eq('negocio_id', negocioData.id).in('profissional_id', ids)
          .order('created_at', { ascending: false }),
        dataHoje
          ? supabase.from(VIEWS.agendamentos)
              .select(`*, preco_final, data, horario_inicio, horario_fim,
                entregas (nome, preco, preco_promocional),
                profissionais (id, nome),
                cliente:users!agendamentos_cliente_id_fkey (id, nome, avatar_path, type)`)
              .eq('negocio_id', negocioData.id).in('profissional_id', ids).gte('data', dataHoje)
              .order('data', { ascending: true }).order('horario_inicio', { ascending: true }).order('id', { ascending: true })
          : Promise.resolve({ data: [], error: null })
      ]);
      if (entregasResult.error) throw entregasResult.error;
      setEntregas(entregasResult.data || []);
      if (agendamentosResult.error) throw agendamentosResult.error;
      const agRows = (agendamentosResult.data || []).map(a => ({
        ...a,
        data: a?.data ?? null,
        horario_inicio: a?.horario_inicio ?? a?.inicio ?? null,
        horario_fim: a?.horario_fim ?? a?.fim ?? null,
      }));
      setAgendamentos(agRows);
    } catch (e) {
      console.error('Erro ao carregar:', e);
      setError(e?.message || 'Erro inesperado.');
    } finally { setLoading(false); }
  };

  const uploadLogoNegocio = async (file) => {
    if (!file) return;
    if (!user?.id) return uiAlert('alerts.session_invalid', 'error');
    if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error');
    try {
      setLogoUploading(true);
      const filePath = `${negocio.id}/logo.webp`;
      const { error: upErr } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true, contentType: 'image/webp' });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from('negocios').update({ logo_path: `logos/${filePath}` }).eq('id', negocio.id).eq('owner_id', user.id);
      if (dbErr) throw dbErr;
      await uiAlert('dashboard.logo_updated', 'success');
      await loadData(true);
    } catch (e) { console.error('Erro ao atualizar logo:', e); await uiAlert('dashboard.logo_update_error', 'error'); }
    finally { setLogoUploading(false); }
  };

  const salvarInfoNegocio = async () => {
    if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error');
    try {
      setInfoSaving(true);
      const endereco = String(formInfo.endereco || '').trim();
      if (endereco && !isEnderecoPadrao(endereco)) throw new Error('Endereco fora do padrao.');
      const payload = {
        nome: String(formInfo.nome || '').trim(), descricao: String(formInfo.descricao || '').trim(),
        telefone: String(formInfo.telefone || '').trim(), endereco,
        instagram: (String(formInfo.instagram || '').trim() || null),
        facebook: (String(formInfo.facebook || '').trim() || null),
        tema: formInfo.tema || 'dark',
      };
      const { error: updErr } = await supabase.from('negocios').update(payload).eq('id', negocio.id).eq('owner_id', user.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.business_info_updated', 'success');
      await loadData(true);
    } catch (e) {
      console.error('Erro ao salvar info:', e);
      if (String(e?.message || '').includes('padrao')) await uiAlert('dashboard.address_format_invalid', 'error');
      else await uiAlert('dashboard.business_info_update_error', 'error');
    } finally { setInfoSaving(false); }
  };

  const salvarTema = async (novoTema) => {
    if (!negocio?.id) return;
    setFormInfo(prev => ({ ...prev, tema: novoTema }));
    try {
      setTemaSaving(true);
      const { error: updErr } = await supabase.from('negocios').update({ tema: novoTema }).eq('id', negocio.id).eq('owner_id', user.id);
      if (updErr) throw updErr;
      setNegocio(prev => prev ? { ...prev, tema: novoTema } : prev);
    } catch (e) {
      console.error('Erro ao salvar tema:', e);
      setFormInfo(prev => ({ ...prev, tema: negocio?.tema || 'dark' }));
      await uiAlert('dashboard.business_info_update_error', 'error');
    } finally { setTemaSaving(false); }
  };

  const uploadGaleria = async (files) => {
    if (!files?.length) return;
    if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error');
    const maxMb = 4;
    const okTypes = ['image/png', 'image/jpeg', 'image/webp'];
    try {
      setGalleryUploading(true);
      for (const file of Array.from(files)) {
        if (!okTypes.includes(file.type)) { await uiAlert('dashboard.gallery_invalid_format', 'error'); continue; }
        if (file.size > maxMb * 1024 * 1024) { await uiAlert('dashboard.gallery_too_large', 'error'); continue; }
        const fileName = `${crypto.randomUUID()}.webp`;
        const filePath = `${negocio.id}/${fileName}`;
        const { error: upErr } = await supabase.storage.from('galerias').upload(filePath, file, { contentType: 'image/webp' });
        if (upErr) { console.error('upload galeria error:', upErr); await uiAlert('dashboard.gallery_upload_error', 'error'); continue; }
        const { error: dbErr } = await supabase.from('galerias').insert({ negocio_id: negocio.id, path: `galerias/${filePath}` });
        if (dbErr) { console.error('insert galeria error:', dbErr); await uiAlert('dashboard.gallery_upload_error', 'error'); }
      }
      await uiAlert('dashboard.gallery_updated', 'success');
      const { data: galeriaData } = await supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocio.id)
        .order('ordem', { ascending: true }).order('created_at', { ascending: true });
      setGaleriaItems(galeriaData || []);
    } catch (e) { console.error('Erro uploadGaleria:', e); await uiAlert('dashboard.gallery_update_error', 'error'); }
    finally { setGalleryUploading(false); }
  };

  const removerImagemGaleria = async (item) => {
    if (!negocio?.id) return;
    const ok = await uiConfirm('dashboard.gallery_remove_confirm', 'warning');
    if (!ok) return;
    try {
      const pathNoPrefix = String(item.path || '').replace('galerias/', '');
      await supabase.storage.from('galerias').remove([pathNoPrefix]);
      const { error: dbErr } = await supabase.from('galerias').delete().eq('id', item.id);
      if (dbErr) throw dbErr;
      setGaleriaItems(prev => prev.filter(x => x.id !== item.id));
      await uiAlert('dashboard.gallery_image_removed', 'success');
    } catch (e) { console.error('Erro removerImagemGaleria:', e); await uiAlert('dashboard.gallery_remove_error', 'error'); }
  };

  const createEntrega = async (e) => {
    e.preventDefault();
    try {
      if (!negocio?.id) throw new Error('Erro ao carregar o negocio');
      const preco = toNumberOrNull(formEntrega.preco);
      const promo = toNumberOrNull(formEntrega.preco_promocional);
      if (preco == null) throw new Error('Preco invalido.');
      if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.');
      const payload = {
        nome: toUpperClean(formEntrega.nome), profissional_id: formEntrega.profissional_id,
        duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos),
        preco, preco_promocional: promo, ativo: true, negocio_id: negocio.id,
      };
      if (!payload.nome) throw new Error('Nome da entrega e obrigatorio.');
      if (!payload.profissional_id) throw new Error('Selecione um profissional.');
      if (!payload.duracao_minutos) throw new Error('Duracao invalida.');
      const { error: insErr } = await supabase.from('entregas').insert([payload]);
      if (insErr) throw insErr;
      await uiAlert(`dashboard.business.${businessGroup}.service_created`, 'success');
      setShowNovaEntrega(false); setEditingEntregaId(null);
      setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
      await loadData(true);
    } catch (e2) {
      console.error('createEntrega error:', e2);
      const msg = String(e2?.message || '');
      if (msg.includes('oferta')) await uiAlert('dashboard.service_promo_invalid', 'error');
      else if (msg.includes('invalido')) await uiAlert('dashboard.service_price_invalid', 'error');
      else if (msg.includes('Duracao')) await uiAlert('dashboard.service_duration_invalid', 'error');
      else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.service_prof_required`, 'error');
      else await uiAlert(`dashboard.business.${businessGroup}.service_create_error`, 'error');
    }
  };

  const updateEntrega = async (e) => {
    e.preventDefault();
    try {
      const preco = toNumberOrNull(formEntrega.preco);
      const promo = toNumberOrNull(formEntrega.preco_promocional);
      if (!toUpperClean(formEntrega.nome)) throw new Error('Nome da entrega e obrigatorio.');
      if (!formEntrega.profissional_id) throw new Error('Selecione um profissional.');
      if (!toNumberOrNull(formEntrega.duracao_minutos)) throw new Error('Duracao invalida.');
      if (preco == null) throw new Error('Preco invalido.');
      if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.');
      const payload = {
        nome: toUpperClean(formEntrega.nome), duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos),
        preco, preco_promocional: promo, profissional_id: formEntrega.profissional_id
      };
      const { error: updErr } = await supabase.from('entregas').update(payload).eq('id', editingEntregaId).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert(`dashboard.business.${businessGroup}.service_updated`, 'success');
      setShowNovaEntrega(false); setEditingEntregaId(null);
      setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
      await loadData(true);
    } catch (e2) {
      console.error('updateEntrega error:', e2);
      const msg = String(e2?.message || '');
      if (msg.includes('oferta')) await uiAlert('dashboard.service_promo_invalid', 'error');
      else if (msg.includes('invalido')) await uiAlert('dashboard.service_price_invalid', 'error');
      else if (msg.includes('Duracao')) await uiAlert('dashboard.service_duration_invalid', 'error');
      else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.service_prof_required`, 'error');
      else await uiAlert(`dashboard.business.${businessGroup}.service_update_error`, 'error');
    }
  };

  const deleteEntrega = async (id) => {
    const ok = await uiConfirm(`dashboard.business.${businessGroup}.service_delete_confirm`, 'warning');
    if (!ok) return;
    try {
      const { error: delErr } = await supabase.from('entregas').delete().eq('id', id).eq('negocio_id', negocio.id);
      if (delErr) throw delErr;
      await uiAlert(`dashboard.business.${businessGroup}.service_deleted`, 'success');
      await loadData(true);
    } catch (e2) {
      console.error('deleteEntrega error:', e2);
      await uiAlert(`dashboard.business.${businessGroup}.service_delete_error`, 'error');
    }
  };

  const createProfissional = async (e) => {
    e.preventDefault();
    try {
      if (!negocio?.id) throw new Error('Erro ao carregar o negocio');
      const dias = normalizeDiasTrabalho(formProfissional.dias_trabalho);
      const payload = {
        negocio_id: negocio.id, nome: toUpperClean(formProfissional.nome),
        profissao: toUpperClean(formProfissional.profissao) || null,
        anos_experiencia: toNumberOrNull(formProfissional.anos_experiencia),
        horario_inicio: formProfissional.horario_inicio, horario_fim: formProfissional.horario_fim,
        almoco_inicio: String(formProfissional.almoco_inicio || '').trim() || null,
        almoco_fim: String(formProfissional.almoco_fim || '').trim() || null,
        dias_trabalho: dias.length ? dias : [1, 2, 3, 4, 5, 6],
      };
      if (!payload.nome) throw new Error('Nome e obrigatorio.');
      const { error: insErr } = await supabase.from('profissionais').insert([payload]);
      if (insErr) throw insErr;
      await uiAlert('dashboard.professional_created', 'success');
      setShowNovoProfissional(false); setEditingProfissional(null);
      setFormProfissional({ nome: '', profissao: '', anos_experiencia: '', horario_inicio: '08:00', horario_fim: '18:00', almoco_inicio: '', almoco_fim: '', dias_trabalho: [1, 2, 3, 4, 5, 6] });
      await loadData(true);
    } catch (e2) { console.error('createProfissional error:', e2); await uiAlert('dashboard.professional_create_error', 'error'); }
  };

  const updateProfissional = async (e) => {
    e.preventDefault();
    try {
      if (!editingProfissional?.id) throw new Error('Profissional invalido.');
      const dias = normalizeDiasTrabalho(formProfissional.dias_trabalho);
      const payload = {
        nome: toUpperClean(formProfissional.nome), profissao: toUpperClean(formProfissional.profissao) || null,
        anos_experiencia: toNumberOrNull(formProfissional.anos_experiencia),
        horario_inicio: formProfissional.horario_inicio, horario_fim: formProfissional.horario_fim,
        almoco_inicio: String(formProfissional.almoco_inicio || '').trim() || null,
        almoco_fim: String(formProfissional.almoco_fim || '').trim() || null, dias_trabalho: dias,
      };
      if (!payload.nome) throw new Error('Nome e obrigatorio.');
      const { error: updErr } = await supabase.from('profissionais').update(payload).eq('id', editingProfissional.id).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.professional_updated', 'success');
      setShowNovoProfissional(false); setEditingProfissional(null);
      await loadData(true);
    } catch (e2) {
      console.error('updateProfissional error:', e2);
      const msg = String(e2?.message || '');
      if (msg.includes('profissional_almoco_bloqueado')) await uiAlert('dashboard.professional_lunch_blocked', 'warning');
      else if (msg.includes('profissional_dia_bloqueado')) await uiAlert('dashboard.professional_workday_blocked', 'warning');
      else await uiAlert('dashboard.professional_update_error', 'error');
    }
  };

  const toggleAtivoProfissional = async (p) => {
    try {
      if (p.ativo === undefined) { await uiAlert('dashboard.professional_missing_active_column', 'error'); return; }
      const novoAtivo = !p.ativo;
      let motivo = null;
      if (!novoAtivo) {
        const r = await uiPrompt('dashboard.professional_inactivate_reason', { variant: 'warning', placeholder: '', initialValue: '' });
        if (r === null) return;
        motivo = r || null;
      }
      const { error: upErr } = await supabase.from('profissionais')
        .update({ ativo: novoAtivo, motivo_inativo: novoAtivo ? null : motivo })
        .eq('id', p.id).eq('negocio_id', negocio.id);
      if (upErr) throw upErr;
      await uiAlert(novoAtivo ? 'dashboard.professional_activated' : 'dashboard.professional_inactivated', 'success');
      await loadData(true);
    } catch (e) { console.error('toggleAtivoProfissional:', e); await uiAlert('dashboard.professional_toggle_error', 'error'); }
  };

  const excluirProfissional = async (p) => {
    const ok = await uiConfirm('dashboard.professional_delete_confirm', 'warning');
    if (!ok) return;
    try {
      const { error: delErr } = await supabase.from('profissionais').delete().eq('id', p.id).eq('negocio_id', negocio.id);
      if (delErr) throw delErr;
      await uiAlert('dashboard.professional_deleted', 'success');
      await loadData(true);
    } catch (e) { console.error('excluirProfissional:', e); await uiAlert('dashboard.professional_delete_error', 'error'); }
  };

  const confirmarAtendimento = async (id) => {
    try {
      const { error: updErr } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.booking_confirmed', 'success');
      await loadData(true);
    } catch (e2) { console.error('confirmarAtendimento error:', e2); await uiAlert('dashboard.booking_confirm_error', 'error'); }
  };

  const cancelarAgendamentoProfissional = async (id) => {
    const ok = await uiConfirm('dashboard.booking_cancel_confirm', 'warning');
    if (!ok) return;
    try {
      const { error: updErr } = await supabase.from('agendamentos').update({ status: 'cancelado_profissional' }).eq('id', id).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.booking_canceled', 'error');
      await loadData(true);
    } catch (e) { console.error('cancelarAgendamentoProfissional:', e); await uiAlert('dashboard.booking_cancel_error', 'error'); }
  };

  const saveParceiroEmail = async () => {
    const email = String(parceiroEmail || '').trim();
    if (!parceiroSelected) { await uiAlert('dashboard.parceiro_selecione_prof', 'error'); return; }
    if (!email || !email.includes('@')) { await uiAlert('dashboard.parceiro_email_invalid', 'error'); return; }
    try {
      setParceiroSaving(true);
      const { error } = await supabase
        .from('profissionais')
        .update({ email: email.toLowerCase() })
        .eq('id', parceiroSelected)
        .eq('negocio_id', negocio.id);
      if (error) throw error;
      setProfissionais(prev => prev.map(p =>
        p.id === parceiroSelected ? { ...p, email: email.toLowerCase() } : p
      ));
      setParceiroSelected('');
      setParceiroEmail('');
      await uiAlert('dashboard.parceiro_saved', 'success');
    } catch (e) {
      console.error('saveParceiroEmail:', e);
      await uiAlert('dashboard.parceiro_save_error', 'error');
    } finally { setParceiroSaving(false); }
  };

  const removeParceiroEmail = async (profId) => {
    const ok = await uiConfirm('dashboard.parceiro_delete_confirm', 'warning');
    if (!ok) return;
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ email: null })
        .eq('id', profId)
        .eq('negocio_id', negocio.id);
      if (error) throw error;
      setProfissionais(prev => prev.map(p =>
        p.id === profId ? { ...p, email: null } : p
      ));
      await uiAlert('dashboard.parceiro_deleted', 'success');
    } catch (e) {
      console.error('removeParceiroEmail:', e);
      await uiAlert('dashboard.parceiro_delete_error', 'error');
    }
  };

  const salvarEmail = async () => {
    const email = String(novoEmail || '').trim();
    if (!email || !email.includes('@')) { await uiAlert('dashboard.account_email_invalid', 'error'); return; }
    try {
      setSavingDados(true);
      const { error: updErr } = await supabase.auth.updateUser({ email });
      if (updErr) throw updErr;
      await uiAlert('dashboard.account_email_update_sent', 'success');
    } catch (e) { console.error('Erro ao alterar email:', e); await uiAlert('dashboard.account_email_update_error', 'error'); }
    finally { setSavingDados(false); }
  };

  const salvarSenha = async () => {
    const pass = String(novaSenha || '');
    const conf = String(confirmarSenha || '');
    if (pass.length < 6) { await uiAlert('dashboard.account_password_too_short', 'error'); return; }
    if (pass !== conf) { await uiAlert('dashboard.account_password_mismatch', 'error'); return; }
    try {
      setSavingDados(true);
      const { error: updErr } = await supabase.auth.updateUser({ password: pass });
      if (updErr) throw updErr;
      setNovaSenha(''); setConfirmarSenha('');
      await uiAlert('dashboard.account_password_updated', 'success');
    } catch (e) { console.error('Erro ao alterar senha:', e); await uiAlert('dashboard.account_password_update_error', 'error'); }
    finally { setSavingDados(false); }
  };

  const agendamentosHoje = useMemo(() => agendamentos.filter(a => sameDay(getAgDate(a), hoje)), [agendamentos, hoje]);
  const hojeValidos = useMemo(() => agendamentosHoje.filter(a => !isCancelStatus(a.status)), [agendamentosHoje]);
  const hojeCancelados = useMemo(() => agendamentosHoje.filter(a => isCancelStatus(a.status)), [agendamentosHoje]);

  const proximoAgendamento = useMemo(() => {
    const nowMin = Number(serverNow?.minutes || 0);
    const futuros = hojeValidos
      .filter(a => timeToMinutes(getAgInicio(a) || '00:00') >= nowMin)
      .sort((a, b) => String(getAgInicio(a)).localeCompare(String(getAgInicio(b))));
    return futuros[0] || null;
  }, [hojeValidos, serverNow?.minutes]);

  const agendamentosDiaSelecionado = useMemo(() => historicoAgendamentos, [historicoAgendamentos]);
  const agendamentosHojeEFuturos = useMemo(() => agendamentos, [agendamentos]);

  const agendamentosAgrupadosPorProfissional = useMemo(() => {
    const map = new Map();
    for (const a of agendamentosHojeEFuturos) {
      const pid = a.profissional_id || a.profissionais?.id || 'sem-prof';
      const nome = a.profissionais?.nome || 'PROFISSIONAL';
      if (!map.has(pid)) map.set(pid, { pid, nome, itens: [] });
      map.get(pid).itens.push(a);
    }
    const grupos = Array.from(map.values()).map(g => ({
      ...g,
      itens: g.itens.slice().sort((a, b) => {
        const d = String(getAgDate(a) || '').localeCompare(String(getAgDate(b) || ''));
        if (d !== 0) return d;
        const h = String(getAgInicio(a) || '').localeCompare(String(getAgInicio(b) || ''));
        if (h !== 0) return h;
        return String(a.id || '').localeCompare(String(b.id || ''));
      })
    }));
    const ordem = new Map((profissionais || []).map((p, idx) => [p.id, idx]));
    grupos.sort((a, b) => (ordem.get(a.pid) ?? 9999) - (ordem.get(b.pid) ?? 9999));
    return grupos;
  }, [agendamentosHojeEFuturos, profissionais]);

  const entregasPorProf = useMemo(() => {
    const map = new Map();
    for (const p of profissionais) map.set(p.id, []);
    for (const s of entregas) {
      if (!map.has(s.profissional_id)) map.set(s.profissional_id, []);
      map.get(s.profissional_id).push(s);
    }
    return map;
  }, [profissionais, entregas]);

  const faturamentoPorProfissionalHoje = useMemo(() => {
    const arr = metricsHoje?.today?.por_profissional || [];
    if (!Array.isArray(arr)) return [];
    const pairs = arr.map(x => {
      if (!x) return null;
      const nome = String(x.nome ?? '').trim();
      const valor = Number(x.faturamento ?? x.valor ?? 0);
      if (!nome) return null;
      return [nome, Number.isFinite(valor) ? valor : 0];
    }).filter(Boolean);
    pairs.sort((a, b) => Number(b[1]) - Number(a[1]));
    return pairs;
  }, [metricsHoje]);

  const faturamentoPorProfissionalFiltro = useMemo(() => {
    const arr = metricsDia?.selected_day?.por_profissional || [];
    if (!Array.isArray(arr)) return [];
    const pairs = arr.map(x => {
      if (!x) return null;
      const nome = String(x.nome ?? '').trim();
      const valor = Number(x.faturamento ?? x.valor ?? 0);
      if (!nome) return null;
      return [nome, Number.isFinite(valor) ? valor : 0];
    }).filter(Boolean);
    pairs.sort((a, b) => Number(b[1]) - Number(a[1]));
    return pairs;
  }, [metricsDia]);

  const tabs = [
    { key: 'visao-geral' }, { key: 'agendamentos' }, { key: 'cancelados' },
    { key: 'historico' }, { key: 'entregas' }, { key: 'profissionais' }, { key: 'info-negocio' },
  ];

  const TAB_LABELS = {
    'visao-geral':   'GERAL',
    'agendamentos':  'AGENDAMENTOS',
    'cancelados':    'CANCELADOS',
    'historico':     'HISTÓRICO',
    'entregas':      tabEntregasLabel,
    'profissionais': 'PROFISSIONAIS',
    'info-negocio':  'INFO DO NEGÓCIO',
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-primary text-xl">CARREGANDO...</div>
      </div>
    </div>
  );

  if (error || !negocio) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-100 border border-red-500/50 rounded-custom p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-normal text-white mb-2">Erro ao carregar</h1>
        <p className="text-gray-400 mb-6">{error || 'Negocio inexistente'}</p>
        <button onClick={() => loadData(true)} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button mb-3 font-normal uppercase">TENTAR NOVAMENTE</button>
        <button onClick={onLogout} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-button font-normal uppercase">SAIR</button>
      </div>
    </div>
  );

  const metricsLoadingHoje = metricsHojeLoading;
  const metricsLoadingDia = metricsDiaLoading;
  const metricsLoadingPeriodo = metricsPeriodoLoading;

  return (
    <div className="min-h-screen bg-black text-white">

      <header className="bg-dark-100 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-800 bg-dark-200 flex items-center justify-center shrink-0">
                {negocio.logo_path ? (
                  <img src={getPublicUrl('logos', negocio.logo_path)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center">
                    <Award className="w-7 h-7 text-black" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-normal">{negocio.nome}</h1>
                <p className="text-xs text-gray-500 -mt-0.5">DASHBOARD</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to={`/v/${negocio.slug}`} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-200 border border-gray-800 hover:border-primary rounded-button text-sm font-normal uppercase">
                <Eye className="w-4 h-4" />VER VITRINE
              </Link>
              <label className="inline-block">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogoNegocio(e.target.files?.[0])} disabled={logoUploading} />
                <span className={`inline-flex items-center justify-center text-center rounded-button font-normal border transition-all uppercase focus:outline-none focus:ring-0 focus:ring-offset-0 ${logoUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer'} px-3 py-2 text-[11px] sm:px-4 sm:py-2 sm:text-sm`}>
                  <span className="sm:hidden">{logoUploading ? '...' : 'LOGO'}</span>
                  <span className="hidden sm:inline">{logoUploading ? 'ENVIANDO...' : 'ALTERAR LOGO'}</span>
                </span>
              </label>
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-button text-sm font-normal uppercase">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">SAIR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-custom p-6">
            <div className="mb-2 flex items-center gap-2">
              <span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="text-green-400 font-normal text-3xl leading-none">$</span>
              <span className="text-sm text-gray-500">FATURAMENTO HOJE</span>
            </div>
            <div className="text-3xl font-normal text-white mb-1">
              {metricsLoadingHoje ? <span className="text-gray-500 text-xl">...</span> : <>R$ {Number(metricsHoje?.today?.faturamento || 0).toFixed(2)}</>}
            </div>
          </div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-6">
            <Calendar className="w-8 h-8 text-blue-400 mb-2" />
            <div className="text-3xl font-normal text-white mb-1">{hojeValidos.length}</div>
            <div className="text-sm text-gray-400">AGENDAMENTOS HOJE</div>
          </div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-6">
            <Users className="w-8 h-8 text-purple-400 mb-2" />
            <div className="text-3xl font-normal text-white mb-1">{profissionais.length}</div>
            <div className="text-sm text-gray-400">PROFISSIONAIS</div>
          </div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-6">
            <TrendingUp className="w-8 h-8 text-primary mb-2" />
            <div className="text-3xl font-normal text-white mb-1">{entregas.length}</div>
            <div className="text-sm text-gray-400">{tabEntregasLabel}</div>
          </div>
        </div>

        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-yellow-400 border-y border-yellow-300/50 mb-8 overflow-hidden h-10 flex items-center">
          <div className="announcement-bar-wrapper flex">
            {[1, 2].map((i) => (
              <div key={i} className="announcement-bar-track flex items-center shrink-0 whitespace-nowrap" aria-hidden={i === 2}>
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-black font-bold text-sm uppercase mx-4">CLIQUE PARA IR</span>
                    <span className="text-black mx-4">●</span>
                    <Link to={`/v/${negocio.slug}`} target="_blank" className="text-black font-normal text-sm uppercase hover:underline underline-offset-4 transition-all mx-4">VER VITRINE</Link>
                    <span className="text-black mx-4">●</span>
                    <a href={SUPORTE_HREF} target="_blank" rel="noreferrer" className="text-black font-normal text-sm uppercase hover:underline underline-offset-4 transition-all mx-4">SUPORTE</a>
                    <span className="text-black mx-4">●</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <style>{`
            @keyframes announcement-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .announcement-bar-wrapper { display: flex; width: max-content; animation: announcement-scroll 50s linear infinite; }
            .announcement-bar-wrapper:hover { animation-play-state: paused; }
            .announcement-bar-track a { position: relative; z-index: 10; cursor: pointer; display: inline-block; }
            @media (prefers-reduced-motion: reduce) { .announcement-bar-wrapper { animation: none; } }
          `}</style>
        </div>

        <div className="bg-dark-100 border border-gray-800 rounded-custom overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-800">
            {tabs.map(t => t.key).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-4 text-sm transition-all uppercase font-normal ${activeTab === tab ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>
                {TAB_LABELS[tab] || tab.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="p-6">

            {activeTab === 'visao-geral' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <div className="text-xs text-gray-500 mb-2">CANCELAMENTOS HOJE</div>
                    <div className="text-3xl font-normal text-white">{Number(metricsHoje?.today?.cancelados || 0)}</div>
                    <div className="text-xs text-gray-300 mt-1">TAXA: <span className="text-primary">{Number(metricsHoje?.today?.taxa_cancelamento || 0).toFixed(1)}%</span></div>
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <div className="text-xs text-gray-500 mb-2">CONCLUÍDOS HOJE</div>
                    <div className="text-3xl font-normal text-white">{Number(metricsHoje?.today?.concluidos || 0)}</div>
                    <div className="text-xs text-gray-300 mt-1">TICKET MÉDIO: <span className="text-primary">R$ {Number(metricsHoje?.today?.ticket_medio || 0).toFixed(2)}</span></div>
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <div className="text-xs text-gray-500 mb-2">PRÓXIMO AGENDAMENTO</div>
                    {proximoAgendamento ? (
                      <>
                        <div className="text-3xl font-normal text-primary">{getAgInicio(proximoAgendamento)}</div>
                        <div className="text-sm text-gray-300 mt-1">{proximoAgendamento.cliente?.nome || '—'} • {proximoAgendamento.profissionais?.nome}</div>
                        <div className="text-xs text-gray-500 mt-1">{proximoAgendamento.entregas?.nome}</div>
                      </>
                    ) : <div className="text-sm text-gray-500">:(</div>}
                  </div>
                </div>

                {faturamentoPorProfissionalHoje.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {faturamentoPorProfissionalHoje.map(([nome, valor]) => (
                      <div key={String(nome)} className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                        <div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div>
                        <div className="font-normal text-white">{String(nome || '—')}</div>
                        <div className="text-primary font-normal mt-1">R$ {Number(valor || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-lg font-normal flex items-center gap-2 uppercase">
                      <span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="font-normal text-2xl">$</span>FATURAMENTO
                    </h3>
                    <DatePicker
                      value={faturamentoData}
                      onChange={(iso) => setFaturamentoData(iso)}
                      todayISO={hoje}
                    />
                  </div>
                  <div className="text-3xl font-normal text-white mb-2">
                    {metricsLoadingDia ? <span className="text-gray-500 text-xl">...</span> : <>R$ {Number(metricsDia?.selected_day?.faturamento || 0).toFixed(2)}</>}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4">
                      <div className="text-xs text-gray-500 mb-1">CONCLUÍDOS</div>
                      <div className="text-xl font-normal text-green-400">{Number(metricsDia?.selected_day?.concluidos || 0)}</div>
                    </div>
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4">
                      <div className="text-xs text-gray-500 mb-1">CANCELADOS</div>
                      <div className="text-xl font-normal text-red-400">{Number(metricsDia?.selected_day?.cancelados || 0)}</div>
                      <div className="text-xs text-gray-500 mt-1">{Number(metricsDia?.selected_day?.taxa_cancelamento || 0).toFixed(1)}%</div>
                    </div>
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4">
                      <div className="text-xs text-gray-500 mb-1">FECHAMENTO</div>
                      <div className="text-xl font-normal text-white">{Number(metricsDia?.selected_day?.taxa_conversao || 0).toFixed(1)}%</div>
                      <div className="text-xs text-gray-500 mt-1">sobre {Number(metricsDia?.selected_day?.total || 0)} agendamento(s)</div>
                    </div>
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4">
                      <div className="text-xs text-gray-500 mb-1">TICKET MÉDIO</div>
                      <div className="text-xl font-normal text-primary">R$ {Number(metricsDia?.selected_day?.ticket_medio || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  {faturamentoPorProfissionalFiltro.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {faturamentoPorProfissionalFiltro.map(([nome, valor]) => (
                        <div key={String(nome)} className="bg-dark-100 border border-gray-800 rounded-custom p-4">
                          <div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div>
                          <div className="font-normal text-white">{String(nome || '—')}</div>
                          <div className="text-primary font-normal mt-1">R$ {Number(valor || 0).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── FATURAMENTO POR PERÍODO — PeriodoSelect nativo ── */}
                  <div className="mt-2 bg-dark-100 border border-gray-800 rounded-custom p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">FATURAMENTO POR PERÍODO</div>
                      <PeriodoSelect
                        value={faturamentoPeriodo}
                        onChange={setFaturamentoPeriodo}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                        <div className="text-xs text-gray-500 mb-1">CONCLUÍDOS</div>
                        <div className="text-xl font-normal text-green-400">{Number(metricsPeriodoData?.period?.concluidos || 0)}</div>
                      </div>
                      <div className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                        <div className="text-xs text-gray-500 mb-1">FATURAMENTO</div>
                        <div className="text-xl font-normal text-primary">{metricsLoadingPeriodo ? '...' : `R$ ${Number(metricsPeriodoData?.period?.faturamento || 0).toFixed(2)}`}</div>
                      </div>
                      <div className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                        <div className="text-xs text-gray-500 mb-1">MÉDIA POR {counterSingular.toUpperCase()}</div>
                        <div className="text-xl font-normal text-white">{metricsLoadingPeriodo ? '...' : `R$ ${Number(metricsPeriodoData?.period?.media_por_atendimento || 0).toFixed(2)}`}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agendamentos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-normal">Agendamentos</h2>
                  <button onClick={() => loadData(true)} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase">ATUALIZAR</button>
                </div>
                {agendamentosAgrupadosPorProfissional.length > 0 ? (
                  <div className="space-y-8">
                    {agendamentosAgrupadosPorProfissional.map(grupo => (
                      <div key={grupo.pid} className="space-y-4">
                        <div className="text-sm text-gray-400 uppercase tracking-wide">{grupo.nome}</div>
                        <div className="space-y-4">
                          {grupo.itens.map(a => {
                            const dataA = getAgDate(a);
                            const isFuturo = dataA > String(hoje || '');
                            const isHoje = dataA === String(hoje || '');
                            const st = computeStatusFromDb(a);
                            const isCancel = isCancelStatus(st);
                            const isDone = isDoneStatus(st);
                            const valorReal = getValorAgendamento(a);
                            return (
                              <div key={a.id} className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <ClienteAvatar cliente={a.cliente} />
                                    <div className="min-w-0">
                                      <p className="font-normal text-lg truncate">{a.cliente?.nome || '—'}</p>
                                      <p className="text-sm text-gray-400 truncate">{a.entregas?.nome} • {a.profissionais?.nome}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {isCancel ? <div className="px-3 py-1 rounded-button text-xs bg-red-500/20 text-red-300">CANCELADO</div>
                                      : isDone ? <div className="px-3 py-1 rounded-button text-xs bg-green-500/20 text-green-400">CONCLUÍDO</div>
                                      : isFuturo ? <div className="px-3 py-1 rounded-button text-xs bg-yellow-500/20 text-yellow-300">FUTURO</div>
                                      : <div className="px-3 py-1 rounded-button text-xs bg-blue-500/20 text-blue-400">AGENDADO</div>}
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div><div className="text-xs text-gray-500">DATA</div><div className="text-sm">{formatDateBRFromISO(getAgDate(a))}</div></div>
                                  <div><div className="text-xs text-gray-500">HORÁRIO</div><div className="text-sm">{getAgInicio(a)}</div></div>
                                  <div><div className="text-xs text-gray-500">VALOR</div><div className="text-sm">R$ {Number(valorReal).toFixed(2)}</div></div>
                                </div>
                                {!isDone && !isCancel && (
                                  isHoje ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <button onClick={() => confirmarAtendimento(a.id)} className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-button text-sm font-normal uppercase">CONFIRMAR ATENDIMENTO</button>
                                      <button onClick={() => cancelarAgendamentoProfissional(a.id)} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-button text-sm font-normal uppercase">CANCELAR</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => cancelarAgendamentoProfissional(a.id)} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-button text-sm font-normal uppercase">CANCELAR</button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-center py-12">Nenhum agendamento hoje ou futuro.</p>}
              </div>
            )}

            {activeTab === 'cancelados' && (
              <div>
                <h2 className="text-2xl font-normal mb-6">Cancelados Hoje</h2>
                {hojeCancelados.length > 0 ? (
                  <div className="space-y-4">
                    {hojeCancelados.sort((a, b) => String(getAgInicio(a)).localeCompare(String(getAgInicio(b)))).map(a => {
                      const valorReal = getValorAgendamento(a);
                      return (
                        <div key={a.id} className="bg-dark-200 border border-red-500/30 rounded-custom p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <ClienteAvatar cliente={a.cliente} />
                              <div className="min-w-0">
                                <p className="font-normal text-lg text-white truncate">{a.cliente?.nome || '—'}</p>
                                <p className="text-sm text-gray-400 truncate">{a.entregas?.nome} • {a.profissionais?.nome}</p>
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-button text-xs bg-red-500/20 border border-red-500/50 text-red-400 shrink-0 ml-2">CANCELADO</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><div className="text-xs text-gray-500">DATA</div><div className="text-white">{formatDateBRFromISO(getAgDate(a))}</div></div>
                            <div><div className="text-xs text-gray-500">HORÁRIO</div><div className="text-white">{getAgInicio(a)}</div></div>
                            <div><div className="text-xs text-gray-500">VALOR</div><div className="text-white">R$ {Number(valorReal).toFixed(2)}</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-gray-500 text-center py-12">Nenhum cancelamento hoje.</p>}
              </div>
            )}

            {activeTab === 'historico' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h2 className="text-2xl font-normal">Histórico</h2>
                  <DatePicker
                    value={historicoData}
                    onChange={(iso) => setHistoricoData(iso)}
                    todayISO={hoje}
                  />
                </div>
                {agendamentosDiaSelecionado.length > 0 ? (
                  <div className="space-y-3">
                    {agendamentosDiaSelecionado.map(a => {
                      const st = computeStatusFromDb(a);
                      const isCancel = isCancelStatus(st);
                      const isDone = isDoneStatus(st);
                      const valorReal = getValorAgendamento(a);
                      return (
                        <div key={a.id} className={`bg-dark-200 border rounded-custom p-4 ${isCancel ? 'border-red-500/30' : 'border-gray-800'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <ClienteAvatar cliente={a.cliente} />
                              <div className="min-w-0">
                                <p className="font-normal text-lg truncate">{a.cliente?.nome || '—'}</p>
                                <p className="text-sm text-gray-400 truncate">{a.entregas?.nome} • {a.profissionais?.nome}</p>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-button text-xs shrink-0 ml-2 ${isCancel ? 'bg-red-500/20 border border-red-500/50 text-red-300' : isDone ? 'bg-green-500/20 border border-green-500/50 text-green-300' : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'}`}>
                              {isCancel ? 'CANCELADO' : isDone ? 'CONCLUÍDO' : 'AGENDADO'}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><div className="text-xs text-gray-500">DATA</div><div className="text-sm">{formatDateBRFromISO(getAgDate(a))}</div></div>
                            <div><div className="text-xs text-gray-500">HORÁRIO</div><div className="text-sm">{getAgInicio(a)}</div></div>
                            <div><div className="text-xs text-gray-500">VALOR</div><div className="text-sm">R$ {Number(valorReal).toFixed(2)}</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="text-gray-500 text-center py-12">Nenhum agendamento carregado para essa data.</div>}
                {historicoHasMore && (
                  <button onClick={loadMoreHistorico} disabled={historicoLoadingMore}
                    className="mt-4 w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase disabled:opacity-60">
                    {historicoLoadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'entregas' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-normal">{sectionTitle}</h2>
                  <button
                    onClick={() => { setShowNovaEntrega(true); setEditingEntregaId(null); setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-button font-normal uppercase border bg-gradient-to-r from-primary to-yellow-600 text-black border-transparent">
                    <Plus className="w-5 h-5" />{btnAddLabel}
                  </button>
                </div>
                {profissionais.length === 0 ? (
                  <div className="text-gray-500">Nenhum profissional cadastrado.</div>
                ) : (
                  <div className="space-y-4">
                    {profissionais.map(p => {
                      const lista = (entregasPorProf.get(p.id) || []).slice().sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
                      return (
                        <div key={p.id} className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="font-normal text-lg">{p.nome}</div>
                            <div className="text-xs text-gray-500">
                              {lista.length} {lista.length === 1 ? counterSingular : counterPlural}
                            </div>
                          </div>
                          {lista.length ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {lista.map(s => {
                                const preco = Number(s.preco ?? 0);
                                const promo = (s.preco_promocional == null) ? null : Number(s.preco_promocional);
                                return (
                                  <div key={s.id} className="bg-dark-100 border border-gray-800 rounded-custom p-5">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h3 className="text-lg font-normal">{s.nome}</h3>
                                        <p className="text-xs text-gray-500">{p.nome}</p>
                                      </div>
                                      <div className="text-right">
                                        {promo != null && promo > 0 && promo < preco ? (
                                          <div className="leading-tight">
                                            <div className="text-sm font-normal text-red-400 line-through">R$ {preco.toFixed(2)}</div>
                                            <div className="text-2xl font-normal text-green-400">R$ {promo.toFixed(2)}</div>
                                          </div>
                                        ) : (
                                          <div className="text-2xl font-normal text-primary">R$ {preco.toFixed(2)}</div>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">{s.duracao_minutos} MIN</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => { setEditingEntregaId(s.id); setFormEntrega({ nome: s.nome || '', duracao_minutos: String(s.duracao_minutos ?? ''), preco: String(s.preco ?? ''), preco_promocional: String(s.preco_promocional ?? ''), profissional_id: s.profissional_id || '' }); setShowNovaEntrega(true); }}
                                        className="flex-1 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-button text-sm font-normal uppercase">EDITAR</button>
                                      <button onClick={() => deleteEntrega(s.id)} className="flex-1 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-button text-sm font-normal uppercase">EXCLUIR</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500">{emptyListMsg}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profissionais' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-normal">Profissionais</h2>
                  <button
                    onClick={() => { setShowNovoProfissional(true); setEditingProfissional(null); setFormProfissional({ nome: '', profissao: '', anos_experiencia: '', horario_inicio: '08:00', horario_fim: '18:00', almoco_inicio: '', almoco_fim: '', dias_trabalho: [1, 2, 3, 4, 5, 6] }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-button font-normal uppercase border bg-gradient-to-r from-primary to-yellow-600 text-black border-transparent">
                    <Plus className="w-5 h-5" />ADICIONAR
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profissionais.map(p => {
                    const ativo = (p.ativo === undefined) ? true : !!p.ativo;
                    const label = normalizeKey(p.status_label);
                    const dotClass = STATUS_COLOR_CLASS[label] || 'bg-gray-500';
                    return (
                      <div key={p.id} className="relative bg-dark-200 border border-gray-800 rounded-custom p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center text-normal font-normal text-xl shrink-0">{p.nome?.[0] || 'P'}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-normal flex items-center gap-2">
                              {p.nome}
                              {!ativo && <span className="absolute top-3 right-3 text-[10px] px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-normal uppercase">INATIVO</span>}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                              <span className="text-xs text-gray-400">{p.status_label || '—'}</span>
                            </div>
                            {p.profissao && <p className="text-xs text-gray-500 mt-1">{p.profissao}</p>}
                            {p.anos_experiencia != null && <p className="text-xs text-gray-500 mt-1">{p.anos_experiencia} ANOS DE EXPERIÊNCIA</p>}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-3">
                          {entregas.filter(s => s.profissional_id === p.id).length} {counterPlural}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          <Clock className="w-4 h-4 inline mr-1" />{p.horario_inicio} - {p.horario_fim}
                          {p.almoco_inicio && p.almoco_fim && <span className="ml-2 text-yellow-300">• {p.almoco_inicio} - {p.almoco_fim}</span>}
                        </div>
                        <div className="flex gap-2 mb-3">
                          <button onClick={() => toggleAtivoProfissional(p)} className={`flex-1 py-2 rounded-button text-sm border font-normal uppercase ${ativo ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-green-500/10 border-green-500/30 text-green-300'}`}>
                            {ativo ? 'INATIVAR' : 'ATIVAR'}
                          </button>
                          <button onClick={() => excluirProfissional(p)} className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-button text-sm font-normal uppercase">EXCLUIR</button>
                        </div>
                        {!ativo && (p.motivo_inativo || p.motivo_inativo === '') && (
                          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-custom p-2 mb-3">
                            INATIVO {p.motivo_inativo ? `• ${p.motivo_inativo}` : ''}
                          </div>
                        )}
                        <button
                          onClick={() => { setEditingProfissional(p); setFormProfissional({ nome: p.nome || '', profissao: p.profissao || '', anos_experiencia: String(p.anos_experiencia ?? ''), horario_inicio: p.horario_inicio || '08:00', horario_fim: p.horario_fim || '18:00', almoco_inicio: p.almoco_inicio || '', almoco_fim: p.almoco_fim || '', dias_trabalho: Array.isArray(p.dias_trabalho) && p.dias_trabalho.length ? p.dias_trabalho : [1, 2, 3, 4, 5, 6] }); setShowNovoProfissional(true); }}
                          className="w-full py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-button text-sm font-normal uppercase">EDITAR</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'info-negocio' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-normal">Info do Negócio</h2>
                  <button onClick={salvarInfoNegocio} disabled={infoSaving}
                    className={`px-5 py-2.5 rounded-button font-normal border flex items-center gap-2 uppercase ${infoSaving ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'}`}>
                    <Save className="w-4 h-4" />{infoSaving ? 'SALVANDO...' : 'SALVAR'}
                  </button>
                </div>
                <div className="flex justify-start">
                  <TemaToggle value={formInfo.tema} onChange={salvarTema} loading={temaSaving} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <label className="block text-sm mb-2">Negócio</label>
                    <input value={formInfo.nome} onChange={(e) => setFormInfo(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="Nome" />
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <label className="block text-sm mb-2">Telefone</label>
                    <input value={formInfo.telefone} onChange={(e) => setFormInfo(prev => ({ ...prev, telefone: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="(xx) xxxxx-xxxx" />
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5 md:col-span-2">
                    <label className="block text-sm mb-2">Endereço</label>
                    <input value={formInfo.endereco} onChange={(e) => setFormInfo(prev => ({ ...prev, endereco: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder='Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais' />
                    <p className="text-[12px] text-yellow-300 mt-2">Use o formato: <span className="text-gray-300">"RUA, NÚMERO - CIDADE, ESTADO"</span><span className="text-gray-500"> Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais</span></p>
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5 md:col-span-2">
                    <label className="block text-sm mb-2">Sobre</label>
                    <textarea value={formInfo.descricao} onChange={(e) => setFormInfo(prev => ({ ...prev, descricao: e.target.value }))} rows={3} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white resize-none" placeholder="Sobre o negócio..." />
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <label className="block text-sm mb-2">Instagram</label>
                    <input value={formInfo.instagram} onChange={(e) => setFormInfo(prev => ({ ...prev, instagram: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="@seuinstagram" />
                  </div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                    <label className="block text-sm mb-2">Facebook</label>
                    <input value={formInfo.facebook} onChange={(e) => setFormInfo(prev => ({ ...prev, facebook: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="facebook.com/..." />
                  </div>
                </div>

                {/* ── PARCEIROS — ProfissionalSelect nativo ── */}
                <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                  <div className="text-sm text-white-600 tracking-wide mb-1">Parceiros</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecione um profissional e informe o email para receber avisos de novo agendamento.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">PROFISSIONAL</label>
                      <ProfissionalSelect
                        value={parceiroSelected}
                        onChange={(id) => {
                          setParceiroSelected(id);
                          const prof = profissionais.find(p => p.id === id);
                          setParceiroEmail(prof?.email || '');
                        }}
                        profissionais={profissionais}
                        placeholder="Selecionar profissional..."
                        apenasAtivos={true}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">EMAIL DO PARCEIRO</label>
                      <input
                        type="email"
                        value={parceiroEmail}
                        onChange={(e) => setParceiroEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white"
                        placeholder="parceiro@email.com"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={parceiroSaving || !parceiroSelected || !parceiroEmail.trim()}
                    onClick={saveParceiroEmail}
                    className="mb-5 px-5 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {parceiroSaving ? 'SALVANDO...' : 'SALVAR E-MAIL'}
                  </button>
                  {profissionais.filter(p => p.email).length > 0 ? (
                    <div className="space-y-2">
                      {profissionais.filter(p => p.email).map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-dark-100 border border-gray-800 rounded-custom px-4 py-3">
                          <div>
                            <div className="text-sm font-normal text-white">{p.nome}</div>
                            <div className="text-xs text-gray-500">{p.email}</div>
                          </div>
                          <button
                            onClick={() => removeParceiroEmail(p.id)}
                            className="text-red-400 hover:text-red-300 text-xs uppercase font-normal border border-red-500/30 rounded-button px-3 py-1"
                          >
                            REMOVER
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">Nenhum parceiro com email cadastrado ainda.</p>
                  )}
                </div>

                <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-4">DADOS DA CONTA</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">EMAIL</label>
                      <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="seu@email.com" />
                      <button type="button" disabled={savingDados} onClick={salvarEmail} className="mt-3 w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase font-normal">SALVAR NOVO EMAIL</button>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">NOVA SENHA</label>
                      <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="••••••••" />
                      <label className="block text-sm mb-2 mt-3">CONFIRMAR SENHA</label>
                      <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="••••••••" />
                      <button type="button" disabled={savingDados} onClick={salvarSenha} className="mt-3 w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 rounded-button text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase font-normal">SALVAR NOVA SENHA</button>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-normal">GALERIA</h3>
                    <label className="inline-block">
                      <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
                      <span className={`inline-flex items-center gap-2 rounded-button font-normal border cursor-pointer transition-all uppercase ${galleryUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>
                        <Plus className="w-4 h-4" />{galleryUploading ? 'ENVIANDO...' : 'ADICIONAR'}
                      </span>
                    </label>
                  </div>
                  {galeriaItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {galeriaItems.map((item) => (
                        <div key={item.id || item.path} className="relative bg-dark-100 border border-gray-800 rounded-custom overflow-hidden">
                          <img src={getPublicUrl('galerias', item.path)} alt="Galeria" className="w-full h-28 object-cover" />
                          <button onClick={() => removerImagemGaleria(item)} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:left-2 sm:top-2 sm:right-auto sm:transform-none px-3 py-1 rounded-full bg-black/60 border border-gray-700 hover:border-red-400 text-[12px] text-red-200 font-normal uppercase">REMOVER</button>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-gray-500">Nenhuma imagem ainda.</div>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MODAL NOVA / EDITAR ENTREGA — ProfissionalSelect nativo ── */}
      {showNovaEntrega && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-normal">{editingEntregaId ? modalEditLabel : modalNewLabel}</h3>
              <button onClick={() => { setShowNovaEntrega(false); setEditingEntregaId(null); setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' }); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={editingEntregaId ? updateEntrega : createEntrega} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Profissional</label>
                <ProfissionalSelect
                  value={formEntrega.profissional_id}
                  onChange={(id) => setFormEntrega({ ...formEntrega, profissional_id: id })}
                  profissionais={profissionais}
                  placeholder="Selecione"
                  apenasAtivos={true}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Nome</label>
                <input type="text" value={formEntrega.nome} onChange={(e) => setFormEntrega({ ...formEntrega, nome: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required />
              </div>
              <div>
                <label className="block text-sm mb-2">Tempo estimado (min)</label>
                <input type="number" value={formEntrega.duracao_minutos} onChange={(e) => setFormEntrega({ ...formEntrega, duracao_minutos: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required />
              </div>
              <div>
                <label className="block text-sm mb-2">Preço (R$)</label>
                <input type="number" step="0.01" value={formEntrega.preco} onChange={(e) => setFormEntrega({ ...formEntrega, preco: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required />
              </div>
              <div>
                <label className="block text-sm mb-2">Preço de OFERTA (opcional)</label>
                <input type="number" step="0.01" value={formEntrega.preco_promocional} onChange={(e) => setFormEntrega({ ...formEntrega, preco_promocional: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" placeholder="Apenas se houver oferta" />
                <p className="text-[12px] text-gray-500 mt-2">O preço de oferta deve ser menor que o preço normal.</p>
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase">
                {editingEntregaId ? 'SALVAR' : `CRIAR ${btnAddLabel}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL NOVO / EDITAR PROFISSIONAL — TimePicker nativo ── */}
      {showNovoProfissional && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-normal">{editingProfissional ? 'EDITAR PROFISSIONAL' : 'NOVO PROFISSIONAL'}</h3>
              <button onClick={() => { setShowNovoProfissional(false); setEditingProfissional(null); setFormProfissional({ nome: '', profissao: '', anos_experiencia: '', horario_inicio: '08:00', horario_fim: '18:00', almoco_inicio: '', almoco_fim: '', dias_trabalho: [1, 2, 3, 4, 5, 6] }); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={editingProfissional ? updateProfissional : createProfissional} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Nome</label>
                <input type="text" value={formProfissional.nome} onChange={(e) => setFormProfissional({ ...formProfissional, nome: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required />
              </div>
              <div>
                <label className="block text-sm mb-2">Como te chamamos?</label>
                <input type="text" value={formProfissional.profissao} onChange={(e) => setFormProfissional({ ...formProfissional, profissao: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" placeholder="Ex: Barbeiro, Manicure..." />
              </div>
              <div>
                <label className="block text-sm mb-2">Anos de experiência</label>
                <input type="number" value={formProfissional.anos_experiencia} onChange={(e) => setFormProfissional({ ...formProfissional, anos_experiencia: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" />
              </div>

              {/* Horário de trabalho — TimePicker nativo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Das</label>
                  <TimePicker
                    value={formProfissional.horario_inicio}
                    onChange={(v) => setFormProfissional({ ...formProfissional, horario_inicio: v })}
                    step={30}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Até</label>
                  <TimePicker
                    value={formProfissional.horario_fim}
                    onChange={(v) => setFormProfissional({ ...formProfissional, horario_fim: v })}
                    step={30}
                  />
                </div>
              </div>

              {/* Horário de almoço — TimePicker nativo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Almoço (Início)</label>
                  <TimePicker
                    value={formProfissional.almoco_inicio}
                    onChange={(v) => setFormProfissional({ ...formProfissional, almoco_inicio: v })}
                    step={15}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Almoço (Fim)</label>
                  <TimePicker
                    value={formProfissional.almoco_fim}
                    onChange={(v) => setFormProfissional({ ...formProfissional, almoco_fim: v })}
                    step={15}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Dias de trabalho</label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {WEEKDAYS.map(d => {
                    const active = (formProfissional.dias_trabalho || []).includes(d.i);
                    return (
                      <button type="button" key={d.i}
                        onClick={() => { const cur = Array.isArray(formProfissional.dias_trabalho) ? [...formProfissional.dias_trabalho] : []; const next = active ? cur.filter(x => x !== d.i) : [...cur, d.i]; setFormProfissional(prev => ({ ...prev, dias_trabalho: normalizeDiasTrabalho(next) })); }}
                        className={`py-2 rounded-button border font-normal text-xs transition-all ${active ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-500'}`}>
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase">
                {editingProfissional ? 'SALVAR' : 'ADICIONAR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
