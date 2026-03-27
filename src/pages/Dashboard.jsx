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

const toNumberOrNull = (v) => {
  if (v === '' || v == null) return null;
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) ? n : null;
};

const sameDay = (a, b) => String(a || '') === String(b || '');

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h * 60) + (m || 0);
}

const getAgDate   = (a) => String(a?.data ?? '');
const getAgInicio = (a) => String(a?.horario_inicio ?? '').slice(0, 5);

const normalizeStatus = (s) =>
  String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const isCancelStatus = (s) => normalizeStatus(s).includes('cancelado');
const isDoneStatus   = (s) => normalizeStatus(s) === 'concluido';
const computeStatusFromDb = (a) => String(a?.status || '');

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
  } catch { return null; }
}

function TemaToggle({ value, onChange, loading }) {
  const isLight = value === 'light';
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-normal uppercase transition-colors ${!isLight ? 'text-primary' : 'text-gray-600'}`}>DARK</span>
      <button type="button" disabled={loading} onClick={() => onChange(isLight ? 'dark' : 'light')} aria-label="Alternar tema da vitrine"
        className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-all duration-300 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isLight ? 'bg-white border-gray-300' : 'bg-dark-200 border-gray-700'}`}>
        <span className={`inline-block h-5 w-5 rounded-full shadow-md transition-all duration-300 ${isLight ? 'translate-x-7 bg-gray-900' : 'translate-x-1 bg-primary'}`} />
      </button>
      <span className={`text-xs font-normal uppercase transition-colors ${isLight ? 'text-primary' : 'text-gray-600'}`}>WHITE</span>
    </div>
  );
}

const toUpperClean = (s) => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();
const isEnderecoPadrao = (s) => /^.+,\s*\d+.*\s-\s.+,\s.+$/.test(String(s || '').trim());

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

const normalizeKey = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getBizLabel = (group, key) =>
  ptBR?.dashboard?.business?.[key]?.[group] ?? ptBR?.dashboard?.business?.[key]?.['servicos'] ?? '';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = useFeedback();

  const uiAlert   = async (key, variant = 'info') => { if (feedback?.showMessage) return feedback.showMessage(key, { variant }); return Promise.resolve(); };
  const uiConfirm = async (key, variant = 'warning') => { if (feedback?.confirm) return !!(await feedback.confirm(key, { variant })); return false; };
  const uiPrompt  = async (key, opts = {}) => { if (feedback?.prompt) return await feedback.prompt(key, opts); return null; };

  const [parceiroProfissional, setParceiroProfissional] = useState(null);

  const checarPermissao = useCallback(async (profissionalId) => {
    if (!parceiroProfissional) return true;
    if (parceiroProfissional.id === profissionalId) return true;
    await uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    return false;
  }, [parceiroProfissional]);

  const [activeTab, setActiveTab] = useState('agendamentos');
  const [negocio, setNegocio]             = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [entregas, setEntregas]           = useState([]);
  const [agendamentos, setAgendamentos]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [serverNow, setServerNow]         = useState(() => ({ ts: null, dow: 0, date: '', source: 'db', minutes: 0 }));
  const [hoje, setHoje]                   = useState(() => '');

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

  const [showEditProfissional, setShowEditProfissional]       = useState(false);
  const [editingProfissionalId, setEditingProfissionalId]     = useState(null);
  const [submittingProfissional, setSubmittingProfissional]   = useState(false);
  const [formProfissional, setFormProfissional] = useState({ nome: '', profissao: '', anos_experiencia: '', horario_inicio: '08:00', horario_fim: '18:00', almoco_inicio: '', almoco_fim: '', dias_trabalho: [1,2,3,4,5,6] });

  // Estado para auto-cadastro do admin como profissional
  const [submittingAdminProf, setSubmittingAdminProf] = useState(false);

  const WEEKDAYS = [
    { value: 0, label: 'Dom' }, { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' }, { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
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

  // O admin já está cadastrado como profissional neste negócio?
  const adminJaEhProfissional = useMemo(() =>
    profissionais.some(p => p.user_id === user?.id),
  [profissionais, user?.id]);

  const fetchNowFromDb = useCallback(async () => {
    const { data, error: rpcErr } = await supabase.rpc('now_sp');
    if (rpcErr) throw rpcErr;
    const payload = data?.[0] ?? data;
    if (!payload || !payload.date) throw new Error('now_sp vazio');
    setServerNow(payload); setHoje(String(payload.date));
    return String(payload.date);
  }, []);

  const reloadFull = useCallback(async () => {
    try {
      const d = await fetchNowFromDb();
      await loadData(d);
    } catch {
      await loadData('');
    }
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
        const ev = payload?.eventType;
        const novo = payload?.new;
        const profIdEvento = novo?.profissional_id;
        const meuId = parceiroProfissional?.id || null;
        const meResponde = !meuId || profIdEvento === meuId;
        if (ev === 'INSERT' && meResponde) setNotifAgendamentos(prev => prev + 1);
        if (ev === 'UPDATE' && meResponde) {
          const st = String(novo?.status || '').toLowerCase();
          if (st.includes('cancelado') && !st.includes('profissional')) setNotifCancelados(prev => prev + 1);
        }
        reloadAgendamentosRef.current();
        loadHoje(negocio.id, parceiroProfissional?.id ?? null);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [negocio?.id, agProfIdsKey, hoje, parceiroProfissional?.id]);

  useEffect(() => {
    setHistoricoData(prev => prev ? prev : hoje);
    setFaturamentoData(prev => prev ? prev : hoje);
  }, [hoje]);

  const loadHoje = async (negocioId, profId = null) => {
    const id = negocioId || negocio?.id; if (!id) return;
    try {
      setMetricsHojeLoading(true);
      const params = { p_negocio_id: id };
      if (profId) params.p_profissional_id = profId;
      const { data, error } = await supabase.rpc('get_dashboard_today', params);
      if (error) throw error;
      setMetricsHoje(data);
    } catch { setMetricsHoje(null); }
    finally { setMetricsHojeLoading(false); }
  };

  const loadDia = async (negocioId, dateISO, profId = null) => {
    const id = negocioId || negocio?.id;
    const date = String(dateISO || faturamentoData || hoje || '');
    if (!id || !date) return;
    try {
      setMetricsDiaLoading(true);
      const params = { p_negocio_id: id, p_date: date };
      if (profId) params.p_profissional_id = profId;
      const { data, error } = await supabase.rpc('get_dashboard_day', params);
      if (error) throw error;
      setMetricsDia(data);
    } catch { setMetricsDia(null); }
    finally { setMetricsDiaLoading(false); }
  };

  const loadPeriodo = async (negocioId, refDateISO, periodo, profId = null) => {
    const id = negocioId || negocio?.id;
    const refDate = String(refDateISO || hoje || '');
    const per = String(periodo || faturamentoPeriodo || '7d');
    if (!id || !refDate) return;
    try {
      setMetricsPeriodoLoading(true);
      const params = { p_negocio_id: id, p_ref_date: refDate, p_periodo: per };
      if (profId) params.p_profissional_id = profId;
      const { data, error } = await supabase.rpc('get_dashboard_period', params);
      if (error) throw error;
      setMetricsPeriodoData(data);
    } catch { setMetricsPeriodoData(null); }
    finally { setMetricsPeriodoLoading(false); }
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
    try {
      setHistoricoLoadingMore(true);
      const nextPage = historicoPage + 1;
      await fetchHistoricoPage({ negocioId: negocio.id, profIds: ids, date: historicoData, page: nextPage, append: true });
      setHistoricoPage(nextPage);
    } catch { } finally { setHistoricoLoadingMore(false); }
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
      let negocioQuery = negocioIdFromState
        ? supabase.from('negocios').select('*').eq('id', negocioIdFromState)
        : supabase.from('negocios').select('*').eq('owner_id', user.id);
      const negocioResult = await negocioQuery.order('created_at', { ascending: true });
      if (negocioResult.error) throw negocioResult.error;
      const negociosList = negocioResult.data || [];
      if (negociosList.length === 0) { setNegocio(null); setProfissionais([]); setEntregas([]); setAgendamentos([]); setError('Nenhum negocio cadastrado.'); setLoading(false); return; }
      if (negociosList.length > 1 && !negocioIdFromState) { navigate('/selecionar-negocio', { replace: true }); setLoading(false); return; }
      const negocioData = negociosList[0];
      setNegocio(negocioData);
      setFormInfo({ nome: negocioData.nome || '', descricao: negocioData.descricao || '', telefone: negocioData.telefone || '', endereco: negocioData.endereco || '', instagram: negocioData.instagram || '', facebook: negocioData.facebook || '', tema: negocioData.tema || 'dark' });
      const [galeriaResult, profissionaisResult] = await Promise.all([
        supabase.from('galerias').select('id, path, ordem').eq('negocio_id', negocioData.id).order('ordem', { ascending: true }).order('created_at', { ascending: true }),
        supabase.rpc('get_profissionais_com_status', { p_negocio_id: negocioData.id })
      ]);
      if (galeriaResult.error) { }
      setGaleriaItems(galeriaResult.data || []);
      if (profissionaisResult.error) throw profissionaisResult.error;
      const profs = profissionaisResult.data || [];
      setProfissionais(profs);
      const souDono = negocioData.owner_id === user.id;
      const meuProfissional = souDono ? null : (profs.find(p => p.user_id === user.id) || null);
      setParceiroProfissional(meuProfissional);
      const profId = meuProfissional?.id ?? null;
      if (profs.length === 0) { setEntregas([]); setAgendamentos([]); setLoading(false); return; }
      const ids = profs.map(p => p.id);
      const dataHoje = (typeof dataRef === 'string' && dataRef) ? dataRef : String(serverNow?.date || hoje || '');
      const [entregasResult, agendamentosResult] = await Promise.all([
        supabase.from('entregas').select('*, profissionais (id, nome)').eq('negocio_id', negocioData.id).in('profissional_id', ids).order('created_at', { ascending: false }),
        dataHoje
          ? supabase.from('agendamentos')
              .select(`*, preco_final, data, horario_inicio, horario_fim, entregas (nome, preco, preco_promocional), profissionais (id, nome), cliente:users!agendamentos_cliente_id_fkey (id, nome, avatar_path, type)`)
              .eq('negocio_id', negocioData.id).in('profissional_id', ids).gte('data', dataHoje)
              .order('data', { ascending: true }).order('horario_inicio', { ascending: true }).order('id', { ascending: true })
          : Promise.resolve({ data: [], error: null })
      ]);
      if (entregasResult.error) throw entregasResult.error;
      setEntregas(entregasResult.data || []);
      if (agendamentosResult.error) throw agendamentosResult.error;
      setAgendamentos((agendamentosResult.data || []).map(a => ({ ...a, data: a?.data ?? null, horario_inicio: a?.horario_inicio ?? null, horario_fim: a?.horario_fim ?? null })));
      if (dataHoje) {
        loadHoje(negocioData.id, profId);
        loadDia(negocioData.id, dataHoje, profId);
        loadPeriodo(negocioData.id, dataHoje, faturamentoPeriodo, profId);
      }
    } catch (e) { setError(e?.message || 'Erro inesperado.'); }
    finally { setLoading(false); }
  }, [user?.id, location?.state?.negocioId, serverNow, hoje, faturamentoPeriodo]);

  // Admin se cadastra como profissional no próprio negócio
  const cadastrarAdminComoProfissional = async () => {
    if (!negocio?.id || !user?.id || submittingAdminProf) return;
    try {
      setSubmittingAdminProf(true);
      // Busca o nome atual do admin em users
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('nome')
        .eq('id', user.id)
        .maybeSingle();
      if (userErr) throw userErr;
      const nome = String(userData?.nome || '').trim() || 'PROFISSIONAL';
      const { error: insErr } = await supabase.from('profissionais').insert([{
        negocio_id:   negocio.id,
        user_id:      user.id,
        nome,
        status:       'ativo',
      }]);
      if (insErr) throw insErr;
      await uiAlert('dashboard.professional_updated', 'success');
      await reloadProfissionais();
    } catch {
      await uiAlert('dashboard.professional_update_error', 'error');
    } finally {
      setSubmittingAdminProf(false);
    }
  };

  const uploadLogoNegocio = async (file) => {
    if (!file || !user?.id) return;
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error');
    try {
      setLogoUploading(true);
      const filePath = `${negocio.id}/logo.webp`;
      const { error: upErr } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true, contentType: 'image/webp' });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from('negocios').update({ logo_path: `logos/${filePath}` }).eq('id', negocio.id).eq('owner_id', user.id);
      if (dbErr) throw dbErr;
      await uiAlert('dashboard.logo_updated', 'success'); await reloadNegocio();
    } catch { await uiAlert('dashboard.logo_update_error', 'error'); }
    finally { setLogoUploading(false); }
  };

  const salvarInfoNegocio = async () => {
    if (!negocio?.id) return uiAlert('alerts.business_not_loaded', 'error');
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    try {
      setInfoSaving(true);
      const endereco = String(formInfo.endereco || '').trim();
      if (endereco && !isEnderecoPadrao(endereco)) throw new Error('Endereco fora do padrao.');
      const payload = { nome: String(formInfo.nome || '').trim(), descricao: String(formInfo.descricao || '').trim(), telefone: String(formInfo.telefone || '').trim(), endereco, instagram: String(formInfo.instagram || '').trim() || null, facebook: String(formInfo.facebook || '').trim() || null, tema: formInfo.tema || 'dark' };
      const { error: updErr } = await supabase.from('negocios').update(payload).eq('id', negocio.id).eq('owner_id', user.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.business_info_updated', 'success'); await reloadNegocio();
    } catch (e) {
      if (String(e?.message || '').includes('padrao')) await uiAlert('dashboard.address_format_invalid', 'error');
      else await uiAlert('dashboard.business_info_update_error', 'error');
    } finally { setInfoSaving(false); }
  };

  const salvarTema = async (novoTema) => {
    if (!negocio?.id) return;
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    setFormInfo(prev => ({ ...prev, tema: novoTema }));
    try {
      setTemaSaving(true);
      const { error: updErr } = await supabase.from('negocios').update({ tema: novoTema }).eq('id', negocio.id).eq('owner_id', user.id);
      if (updErr) throw updErr;
      setNegocio(prev => prev ? { ...prev, tema: novoTema } : prev);
    } catch { setFormInfo(prev => ({ ...prev, tema: negocio?.tema || 'dark' })); await uiAlert('dashboard.business_info_update_error', 'error'); }
    finally { setTemaSaving(false); }
  };

  const uploadGaleria = async (files) => {
    if (!files?.length || !negocio?.id) return;
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    const okTypes = ['image/png', 'image/jpeg', 'image/webp'];
    try {
      setGalleryUploading(true);
      for (const file of Array.from(files)) {
        if (!okTypes.includes(file.type)) { await uiAlert('dashboard.gallery_invalid_format', 'error'); continue; }
        if (file.size > 4 * 1024 * 1024) { await uiAlert('dashboard.gallery_too_large', 'error'); continue; }
        const filePath = `${negocio.id}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from('galerias').upload(filePath, file, { contentType: 'image/webp' });
        if (upErr) { await uiAlert('dashboard.gallery_upload_error', 'error'); continue; }
        const { error: dbErr } = await supabase.from('galerias').insert({ negocio_id: negocio.id, path: `galerias/${filePath}` });
        if (dbErr) await uiAlert('dashboard.gallery_upload_error', 'error');
      }
      await uiAlert('dashboard.gallery_updated', 'success'); await reloadGaleria();
    } catch { await uiAlert('dashboard.gallery_update_error', 'error'); }
    finally { setGalleryUploading(false); }
  };

  const removerImagemGaleria = async (item) => {
    if (!negocio?.id) return;
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    const ok = await uiConfirm('dashboard.gallery_remove_confirm', 'warning'); if (!ok) return;
    try {
      const { error: dbErr } = await supabase.from('galerias').delete().eq('id', item.id);
      if (dbErr) throw dbErr;
      setGaleriaItems(prev => prev.filter(x => x.id !== item.id));
      await uiAlert('dashboard.gallery_image_removed', 'success');
    } catch { await uiAlert('dashboard.gallery_remove_error', 'error'); }
  };

  const createEntrega = async (e) => {
    e.preventDefault(); if (submittingEntrega) return;
    try {
      setSubmittingEntrega(true);
      if (!negocio?.id) throw new Error('Erro ao carregar o negocio');
      const profId = formEntrega.profissional_id;
      if (!await checarPermissao(profId)) return;
      const preco = toNumberOrNull(formEntrega.preco); const promo = toNumberOrNull(formEntrega.preco_promocional);
      if (preco == null) throw new Error('Preco invalido.');
      if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.');
      const payload = { nome: toUpperClean(formEntrega.nome), profissional_id: profId, duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos), preco, preco_promocional: promo, ativo: true, negocio_id: negocio.id };
      if (!payload.nome) throw new Error('Nome da entrega e obrigatorio.');
      if (!payload.profissional_id) throw new Error('Selecione um profissional.');
      if (!payload.duracao_minutos) throw new Error('Duracao invalida.');
      const { error: insErr } = await supabase.from('entregas').insert([payload]);
      if (insErr) throw insErr;
      await uiAlert(`dashboard.business.${businessGroup}.service_created`, 'success');
      setShowNovaEntrega(false); setEditingEntregaId(null);
      setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
      await reloadEntregas();
    } catch (e2) {
      const msg = String(e2?.message || '');
      if (msg.includes('oferta')) await uiAlert('dashboard.service_promo_invalid', 'error');
      else if (msg.includes('invalido')) await uiAlert('dashboard.service_price_invalid', 'error');
      else if (msg.includes('Duracao')) await uiAlert('dashboard.service_duration_invalid', 'error');
      else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.service_prof_required`, 'error');
      else await uiAlert(`dashboard.business.${businessGroup}.service_create_error`, 'error');
    } finally { setSubmittingEntrega(false); }
  };

  const updateEntrega = async (e) => {
    e.preventDefault(); if (submittingEntrega) return;
    try {
      setSubmittingEntrega(true);
      const profId = formEntrega.profissional_id;
      if (!await checarPermissao(profId)) return;
      const preco = toNumberOrNull(formEntrega.preco); const promo = toNumberOrNull(formEntrega.preco_promocional);
      if (!toUpperClean(formEntrega.nome)) throw new Error('Nome da entrega e obrigatorio.');
      if (!profId) throw new Error('Selecione um profissional.');
      if (!toNumberOrNull(formEntrega.duracao_minutos)) throw new Error('Duracao invalida.');
      if (preco == null) throw new Error('Preco invalido.');
      if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.');
      const payload = { nome: toUpperClean(formEntrega.nome), duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos), preco, preco_promocional: promo, profissional_id: profId };
      const { error: updErr } = await supabase.from('entregas').update(payload).eq('id', editingEntregaId).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert(`dashboard.business.${businessGroup}.service_updated`, 'success');
      setShowNovaEntrega(false); setEditingEntregaId(null);
      setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
      await reloadEntregas();
    } catch (e2) {
      const msg = String(e2?.message || '');
      if (msg.includes('oferta')) await uiAlert('dashboard.service_promo_invalid', 'error');
      else if (msg.includes('invalido')) await uiAlert('dashboard.service_price_invalid', 'error');
      else if (msg.includes('Duracao')) await uiAlert('dashboard.service_duration_invalid', 'error');
      else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.service_prof_required`, 'error');
      else await uiAlert(`dashboard.business.${businessGroup}.service_update_error`, 'error');
    } finally { setSubmittingEntrega(false); }
  };

  const deleteEntrega = async (entrega) => {
    if (!await checarPermissao(entrega.profissional_id)) return;
    const ok = await uiConfirm(`dashboard.business.${businessGroup}.service_delete_confirm`, 'warning'); if (!ok) return;
    try {
      const { error: delErr } = await supabase.from('entregas').delete().eq('id', entrega.id).eq('negocio_id', negocio.id);
      if (delErr) throw delErr;
      await uiAlert(`dashboard.business.${businessGroup}.service_deleted`, 'success'); await reloadEntregas();
    } catch { await uiAlert(`dashboard.business.${businessGroup}.service_delete_error`, 'error'); }
  };

  const toggleStatusProfissional = async (p) => {
    if (!await checarPermissao(p.id)) return;
    try {
      const novoStatus = p.status === 'ativo' ? 'inativo' : 'ativo';
      let motivo = null;
      if (novoStatus === 'inativo') {
        const r = await uiPrompt('dashboard.professional_inactivate_reason', { variant: 'warning' });
        if (r === null) return;
        motivo = r || null;
      }
      const { error: upErr } = await supabase.from('profissionais')
        .update({ status: novoStatus, motivo_inativo: novoStatus === 'ativo' ? null : motivo })
        .eq('id', p.id).eq('negocio_id', negocio.id);
      if (upErr) throw upErr;
      await uiAlert(novoStatus === 'ativo' ? 'dashboard.professional_activated' : 'dashboard.professional_inactivated', 'success');
      await reloadProfissionais();
    } catch { await uiAlert('dashboard.professional_toggle_error', 'error'); }
  };

  const excluirProfissional = async (p) => {
    if (!await checarPermissao(p.id)) return;
    const ok = await uiConfirm('dashboard.professional_delete_confirm', 'warning'); if (!ok) return;
    try {
      const { error: delErr } = await supabase.from('profissionais').delete().eq('id', p.id).eq('negocio_id', negocio.id);
      if (delErr) throw delErr;
      await uiAlert('dashboard.professional_deleted', 'success');
      const profs = await reloadProfissionais();
      if (profs?.length) await reloadEntregas(negocio.id, profs.map(p => p.id)); else setEntregas([]);
    } catch { await uiAlert('dashboard.professional_delete_error', 'error'); }
  };

  const updateProfissional = async (e) => {
    e.preventDefault(); if (submittingProfissional) return;
    try {
      setSubmittingProfissional(true);
      if (!await checarPermissao(editingProfissionalId)) return;
      const payload = {
        nome: String(formProfissional.nome || '').trim(),
        profissao: String(formProfissional.profissao || '').trim() || null,
        anos_experiencia: formProfissional.anos_experiencia !== '' ? Number(formProfissional.anos_experiencia) : null,
        horario_inicio: formProfissional.horario_inicio || '08:00',
        horario_fim: formProfissional.horario_fim || '18:00',
        almoco_inicio: formProfissional.almoco_inicio || null,
        almoco_fim: formProfissional.almoco_fim || null,
        dias_trabalho: formProfissional.dias_trabalho,
      };
      if (!payload.nome) throw new Error('Nome obrigatorio.');
      const { error: updErr } = await supabase.from('profissionais').update(payload).eq('id', editingProfissionalId).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.professional_updated', 'success');
      setShowEditProfissional(false); setEditingProfissionalId(null);
      await reloadProfissionais();
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('profissional_almoco_bloqueado')) await uiAlert('dashboard.professional_almoco_blocked', 'error');
      else if (msg.includes('profissional_dia_bloqueado')) await uiAlert('dashboard.professional_dia_blocked', 'error');
      else await uiAlert('dashboard.professional_update_error', 'error');
    } finally { setSubmittingProfissional(false); }
  };

  const aprovarParceiro = async (prof) => {
    if (parceiroProfissional) return uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    try {
      const { error } = await supabase.from('profissionais').update({ status: 'ativo' }).eq('id', prof.id).eq('negocio_id', negocio.id);
      if (error) throw error;
      await uiAlert('dashboard.professional_approved', 'success'); await reloadProfissionais();
    } catch { await uiAlert('dashboard.partner_approve_error', 'error'); }
  };

  const confirmarAtendimento = async (a) => {
    if (!await checarPermissao(a.profissional_id)) return;
    try {
      const { error: updErr } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', a.id).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert('dashboard.booking_confirmed', 'success');
      await reloadAgendamentos(); loadHoje(negocio.id, parceiroProfissional?.id ?? null);
    } catch { await uiAlert('dashboard.booking_confirm_error', 'error'); }
  };

  const cancelarAgendamento = async (a) => {
    if (!await checarPermissao(a.profissional_id)) return;
    const ok = await uiConfirm('dashboard.booking_cancel_confirm', 'warning'); if (!ok) return;
    try {
      const { error } = await supabase.rpc('cancelar_agendamento_profissional', { p_agendamento_id: a.id });
      if (error) throw error;
      await uiAlert('dashboard.booking_canceled', 'error');
      await reloadAgendamentos(); loadHoje(negocio.id, parceiroProfissional?.id ?? null);
    } catch { await uiAlert('dashboard.booking_cancel_error', 'error'); }
  };

  const salvarEmail = async () => {
    const email = String(novoEmail || '').trim();
    if (!email || !email.includes('@')) { await uiAlert('dashboard.account_email_invalid', 'error'); return; }
    try { setSavingDados(true); const { error: updErr } = await supabase.auth.updateUser({ email }); if (updErr) throw updErr; await uiAlert('dashboard.account_email_update_sent', 'success'); }
    catch { await uiAlert('dashboard.account_email_update_error', 'error'); } finally { setSavingDados(false); }
  };

  const salvarSenha = async () => {
    const pass = String(novaSenha || ''); const conf = String(confirmarSenha || '');
    if (pass.length < 6) { await uiAlert('dashboard.account_password_too_short', 'error'); return; }
    if (pass !== conf) { await uiAlert('dashboard.account_password_mismatch', 'error'); return; }
    try { setSavingDados(true); const { error: updErr } = await supabase.auth.updateUser({ password: pass }); if (updErr) throw updErr; setNovaSenha(''); setConfirmarSenha(''); await uiAlert('dashboard.account_password_updated', 'success'); }
    catch { await uiAlert('dashboard.account_password_update_error', 'error'); } finally { setSavingDados(false); }
  };

  const agendamentosHoje = useMemo(() => {
    const base = agendamentos.filter(a => sameDay(getAgDate(a), hoje));
    if (!parceiroProfissional) return base;
    return base.filter(a => a.profissional_id === parceiroProfissional.id);
  }, [agendamentos, hoje, parceiroProfissional?.id]);

  const hojeValidos    = useMemo(() => agendamentosHoje.filter(a => !isCancelStatus(a.status)), [agendamentosHoje]);
  const hojeCancelados = useMemo(() => agendamentosHoje.filter(a => isCancelStatus(a.status)), [agendamentosHoje]);

  const proximoAgendamento = useMemo(() => {
    const nowMin = Number(serverNow?.minutes || 0);
    return hojeValidos.filter(a => timeToMinutes(getAgInicio(a) || '00:00') >= nowMin).sort((a, b) => String(getAgInicio(a)).localeCompare(String(getAgInicio(b))))[0] || null;
  }, [hojeValidos, serverNow?.minutes]);

  const agendamentosAgrupadosPorProfissional = useMemo(() => {
    const fonte = parceiroProfissional
      ? agendamentos.filter(a => a.profissional_id === parceiroProfissional.id)
      : agendamentos;
    const map = new Map();
    for (const a of fonte) { const pid = a.profissional_id || a.profissionais?.id || 'sem-prof'; const nome = a.profissionais?.nome || 'PROFISSIONAL'; if (!map.has(pid)) map.set(pid, { pid, nome, itens: [] }); map.get(pid).itens.push(a); }
    const grupos = Array.from(map.values()).map(gr => ({ ...gr, itens: gr.itens.slice().sort((a, b) => { const d = String(getAgDate(a) || '').localeCompare(String(getAgDate(b) || '')); if (d !== 0) return d; const h = String(getAgInicio(a) || '').localeCompare(String(getAgInicio(b) || '')); if (h !== 0) return h; return String(a.id || '').localeCompare(String(b.id || '')); }) }));
    const ordem = new Map((profissionais || []).map((p, idx) => [p.id, idx]));
    grupos.sort((a, b) => (ordem.get(a.pid) ?? 9999) - (ordem.get(b.pid) ?? 9999));
    return grupos;
  }, [agendamentos, profissionais, parceiroProfissional?.id]);

  const entregasPorProf = useMemo(() => {
    const map = new Map(); for (const p of profissionais) map.set(p.id, []); for (const s of entregas) { if (!map.has(s.profissional_id)) map.set(s.profissional_id, []); map.get(s.profissional_id).push(s); } return map;
  }, [profissionais, entregas]);

  const faturamentoPorProfissionalHoje   = useMemo(() => { const arr = metricsHoje?.today?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsHoje]);
  const faturamentoPorProfissionalFiltro = useMemo(() => { const arr = metricsDia?.selected_day?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsDia]);

  const tabs = parceiroProfissional
    ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais']
    : ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais', 'info-negocio'];

  const TAB_LABELS = { 'visao-geral': 'GERAL', 'agendamentos': 'AGENDAMENTOS', 'cancelados': 'CANCELADOS', 'historico': 'HISTÓRICO', 'entregas': tabEntregasLabel, 'profissionais': 'PROFISSIONAIS', 'info-negocio': 'INFO DO NEGÓCIO' };

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
        <button onClick={reloadFull} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button mb-3 font-normal uppercase">TENTAR NOVAMENTE</button>
        <button onClick={onLogout} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-button font-normal uppercase">SAIR</button>
      </div>
    </div>
  );

  const souDono = negocio.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-black text-white">

      <header className="bg-dark-100 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-800 bg-dark-200 flex items-center justify-center shrink-0">
                {negocio.logo_path
                  ? <img src={getPublicUrl('logos', negocio.logo_path)} alt="Logo" className="w-full h-full object-cover" />
                  : <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center"><Award className="w-7 h-7 text-black" /></div>}
              </div>
              <div>
                <h1 className="text-xl font-normal">{negocio.nome}</h1>
                {!parceiroProfissional
                  ? <button type="button" onClick={() => navigate('/selecionar-negocio')} className="text-xs text-gray-500 hover:text-primary transition-colors -mt-0.5 block">TROCAR NEGÓCIO</button>
                  : <span className="text-xs text-primary -mt-0.5 block">{parceiroProfissional.nome}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to={`/v/${negocio.slug}`} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-200 border border-gray-800 hover:border-primary rounded-button text-sm font-normal uppercase">
                <Eye className="w-4 h-4" />VER VITRINE
              </Link>
              {!parceiroProfissional && (
                <label className="inline-block">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogoNegocio(e.target.files?.[0])} disabled={logoUploading} />
                  <span className={`inline-flex items-center justify-center text-center rounded-button font-normal border transition-all uppercase focus:outline-none ${logoUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer'} px-3 py-2 text-[11px] sm:px-4 sm:py-2 sm:text-sm`}>
                    <span className="sm:hidden">{logoUploading ? '...' : 'LOGO'}</span>
                    <span className="hidden sm:inline">{logoUploading ? 'ENVIANDO...' : 'ALTERAR LOGO'}</span>
                  </span>
                </label>
              )}
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-button text-sm font-normal uppercase">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">SAIR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 items-start">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-custom p-6">
            <div className="mb-2 flex items-center gap-2"><span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="text-green-400 font-normal text-3xl leading-none">$</span><span className="text-sm text-gray-500">FATURAMENTO HOJE</span></div>
            <div className="text-3xl font-normal text-white mb-1">{metricsHojeLoading ? <span className="text-gray-500 text-xl">...</span> : <>R$ {Number(metricsHoje?.today?.faturamento || 0).toFixed(2)}</>}</div>
          </div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-6"><Calendar className="w-8 h-8 text-blue-400 mb-2" /><div className="text-3xl font-normal text-white mb-1">{hojeValidos.length}</div><div className="text-sm text-gray-400">AGENDAMENTOS HOJE</div></div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-6"><Users className="w-8 h-8 text-purple-400 mb-2" /><div className="text-3xl font-normal text-white mb-1">{profissionais.length}</div><div className="text-sm text-gray-400">PROFISSIONAIS</div></div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-6"><TrendingUp className="w-8 h-8 text-primary mb-2" /><div className="text-3xl font-normal text-white mb-1">{entregas.length}</div><div className="text-sm text-gray-400">{tabEntregasLabel}</div></div>
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
            {tabs.map(tab => {
              const notif = tab === 'agendamentos' ? notifAgendamentos : tab === 'cancelados' ? notifCancelados : 0;
              return (
                <button key={tab}
                  onClick={() => { setActiveTab(tab); if (tab === 'agendamentos') setNotifAgendamentos(0); if (tab === 'cancelados') setNotifCancelados(0); }}
                  className={`relative flex-shrink-0 px-6 py-4 text-sm transition-all uppercase font-normal ${activeTab === tab ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>
                  {TAB_LABELS[tab]}
                  {notif > 0 && (<span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center leading-none">{notif > 99 ? '99+' : notif}</span>)}
                </button>
              );
            })}
          </div>

          <div className="p-6">

            {activeTab === 'visao-geral' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4 items-start">
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-2">CANCELAMENTOS HOJE</div><div className="text-3xl font-normal text-white">{Number(metricsHoje?.today?.cancelados || 0)}</div><div className="text-xs text-gray-300 mt-1">TAXA: <span className="text-primary">{Number(metricsHoje?.today?.taxa_cancelamento || 0).toFixed(1)}%</span></div></div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-2">CONCLUÍDOS HOJE</div><div className="text-3xl font-normal text-white">{Number(metricsHoje?.today?.concluidos || 0)}</div><div className="text-xs text-gray-300 mt-1">TICKET MÉDIO: <span className="text-primary">R$ {Number(metricsHoje?.today?.ticket_medio || 0).toFixed(2)}</span></div></div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-2">PRÓXIMO AGENDAMENTO</div>{proximoAgendamento ? (<><div className="text-3xl font-normal text-primary">{getAgInicio(proximoAgendamento)}</div><div className="text-sm text-gray-300 mt-1">{proximoAgendamento.cliente?.nome || '—'} • {proximoAgendamento.profissionais?.nome}</div><div className="text-xs text-gray-500 mt-1">{proximoAgendamento.entregas?.nome}</div></>) : <div className="text-sm text-gray-500">:(</div>}</div>
                </div>
                {!parceiroProfissional && faturamentoPorProfissionalHoje.length > 0 && (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">{faturamentoPorProfissionalHoje.map(([nome, valor]) => (<div key={String(nome)} className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div><div className="font-normal text-white">{String(nome || '—')}</div><div className="text-primary font-normal mt-1">R$ {Number(valor || 0).toFixed(2)}</div></div>))}</div>)}
                <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"><h3 className="text-lg font-normal flex items-center gap-2 uppercase"><span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="font-normal text-2xl">$</span>FATURAMENTO</h3><DatePicker value={faturamentoData} onChange={(iso) => setFaturamentoData(iso)} todayISO={hoje} /></div>
                  <div className="text-3xl font-normal text-white mb-2">{metricsDiaLoading ? <span className="text-gray-500 text-xl">...</span> : <>R$ {Number(metricsDia?.selected_day?.faturamento || 0).toFixed(2)}</>}</div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 items-start">
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">CONCLUÍDOS</div><div className="text-xl font-normal text-green-400">{Number(metricsDia?.selected_day?.concluidos || 0)}</div></div>
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">CANCELADOS</div><div className="text-xl font-normal text-red-400">{Number(metricsDia?.selected_day?.cancelados || 0)}</div><div className="text-xs text-gray-500 mt-1">{Number(metricsDia?.selected_day?.taxa_cancelamento || 0).toFixed(1)}%</div></div>
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">FECHAMENTO</div><div className="text-xl font-normal text-white">{Number(metricsDia?.selected_day?.taxa_conversao || 0).toFixed(1)}%</div><div className="text-xs text-gray-500 mt-1">sobre {Number(metricsDia?.selected_day?.total || 0)} agendamento(s)</div></div>
                    <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">TICKET MÉDIO</div><div className="text-xl font-normal text-primary">R$ {Number(metricsDia?.selected_day?.ticket_medio || 0).toFixed(2)}</div></div>
                  </div>
                  {!parceiroProfissional && faturamentoPorProfissionalFiltro.length > 0 && (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 items-start">{faturamentoPorProfissionalFiltro.map(([nome, valor]) => (<div key={String(nome)} className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div><div className="font-normal text-white">{String(nome || '—')}</div><div className="text-primary font-normal mt-1">R$ {Number(valor || 0).toFixed(2)}</div></div>))}</div>)}
                  <div className="mt-2 bg-dark-100 border border-gray-800 rounded-custom p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3"><div className="text-xs text-gray-500 uppercase tracking-wide">FATURAMENTO POR PERÍODO</div><PeriodoSelect value={faturamentoPeriodo} onChange={setFaturamentoPeriodo} /></div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                      <div className="bg-dark-200 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">CONCLUÍDOS</div><div className="text-xl font-normal text-green-400">{Number(metricsPeriodoData?.period?.concluidos || 0)}</div></div>
                      <div className="bg-dark-200 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">FATURAMENTO</div><div className="text-xl font-normal text-primary">{metricsPeriodoLoading ? '...' : `R$ ${Number(metricsPeriodoData?.period?.faturamento || 0).toFixed(2)}`}</div></div>
                      <div className="bg-dark-200 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">MÉDIA POR {counterSingular.toUpperCase()}</div><div className="text-xl font-normal text-white">{metricsPeriodoLoading ? '...' : `R$ ${Number(metricsPeriodoData?.period?.media_por_atendimento || 0).toFixed(2)}`}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agendamentos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-normal">Agendamentos</h2>
                  <button onClick={() => reloadAgendamentos()} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase">ATUALIZAR</button>
                </div>
                {agendamentosAgrupadosPorProfissional.length > 0 ? (
                  <div className="space-y-8">
                    {agendamentosAgrupadosPorProfissional.map(grupo => (
                      <div key={grupo.pid} className="space-y-4">
                        <div className="text-sm text-gray-400 uppercase tracking-wide">{grupo.nome}</div>
                        <div className="space-y-4">
                          {grupo.itens.map(a => {
                            const dataA    = getAgDate(a);
                            const isFuturo = dataA > String(hoje || '');
                            const isHoje   = dataA === String(hoje || '');
                            const st       = computeStatusFromDb(a);
                            const isCancel = isCancelStatus(st);
                            const isDone   = isDoneStatus(st);
                            const valorReal = getValorAgendamento(a);
                            return (
                              <div key={a.id} className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-normal text-white truncate">{a.cliente?.nome || '—'}</p>
                                  <div className="shrink-0">
                                    {isCancel ? <div className="px-3 py-1 rounded-button text-xs bg-red-500/20 text-red-300">CANCELADO</div>
                                      : isDone ? <div className="px-3 py-1 rounded-button text-xs bg-green-500/20 text-green-400">CONCLUÍDO</div>
                                      : isFuturo ? <div className="px-3 py-1 rounded-button text-xs bg-yellow-500/20 text-yellow-300">FUTURO</div>
                                      : <div className="px-3 py-1 rounded-button text-xs bg-blue-500/20 text-blue-400">AGENDADO</div>}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 truncate mb-0.5">PROF: {a.profissionais?.nome || '—'}</p>
                                <p className="text-xs text-primary truncate mb-3">{a.entregas?.nome || '—'}</p>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div><div className="text-xs text-gray-500">DATA</div><div className="text-sm">{formatDateBRFromISO(getAgDate(a))}</div></div>
                                  <div><div className="text-xs text-gray-500">HORÁRIO</div><div className="text-sm">{getAgInicio(a)}</div></div>
                                  <div><div className="text-xs text-gray-500">VALOR</div><div className="text-sm">R$ {Number(valorReal).toFixed(2)}</div></div>
                                </div>
                                {!isDone && !isCancel && (
                                  isHoje ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <button onClick={() => confirmarAtendimento(a)} className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-button text-sm font-normal uppercase">CONFIRMAR ATENDIMENTO</button>
                                      <button onClick={() => cancelarAgendamento(a)} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-button text-sm font-normal uppercase">CANCELAR</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => cancelarAgendamento(a)} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-button text-sm font-normal uppercase">CANCELAR</button>
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
                          <div className="flex items-start justify-between gap-2 mb-1"><p className="text-sm font-normal text-white truncate">{a.cliente?.nome || '—'}</p><div className="px-3 py-1 rounded-button text-xs bg-red-500/20 border border-red-500/50 text-red-400 shrink-0">CANCELADO</div></div>
                          <p className="text-xs text-gray-500 truncate mb-0.5">PROF: {a.profissionais?.nome || '—'}</p>
                          <p className="text-xs text-primary truncate mb-3">{a.entregas?.nome || '—'}</p>
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
                  <DatePicker value={historicoData} onChange={(iso) => setHistoricoData(iso)} todayISO={hoje} />
                </div>
                {historicoAgendamentos.length > 0 ? (
                  <div className="space-y-3">
                    {historicoAgendamentos.map(a => {
                      const st = computeStatusFromDb(a); const isCancel = isCancelStatus(st); const isDone = isDoneStatus(st); const valorReal = getValorAgendamento(a);
                      return (
                        <div key={a.id} className={`bg-dark-200 border rounded-custom p-4 ${isCancel ? 'border-red-500/30' : 'border-gray-800'}`}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-normal text-white truncate">{a.cliente?.nome || '—'}</p>
                            <div className={`px-3 py-1 rounded-button text-xs shrink-0 ${isCancel ? 'bg-red-500/20 border border-red-500/50 text-red-300' : isDone ? 'bg-green-500/20 border border-green-500/50 text-green-300' : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'}`}>
                              {isCancel ? 'CANCELADO' : isDone ? 'CONCLUÍDO' : 'AGENDADO'}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-0.5">PROF: {a.profissionais?.nome || '—'}</p>
                          <p className="text-xs text-primary truncate mb-3">{a.entregas?.nome || '—'}</p>
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
                  <button onClick={loadMoreHistorico} disabled={historicoLoadingMore} className="mt-4 w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase disabled:opacity-60">
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
                    onClick={() => { const profId = parceiroProfissional ? parceiroProfissional.id : ''; setShowNovaEntrega(true); setEditingEntregaId(null); setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: profId }); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-button font-normal uppercase border bg-gradient-to-r from-primary to-yellow-600 text-black border-transparent">
                    <Plus className="w-5 h-5" />{btnAddLabel}
                  </button>
                </div>
                {profissionais.length === 0 ? <div className="text-gray-500">Nenhum profissional cadastrado.</div> : (
                  <div className="space-y-4">
                    {profissionais.map(p => {
                      const lista = (entregasPorProf.get(p.id) || []).slice().sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
                      return (
                        <div key={p.id} className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                          <div className="flex items-center justify-between mb-4"><div className="font-normal text-lg">{p.nome}</div><div className="text-xs text-gray-500">{lista.length} {lista.length === 1 ? counterSingular : counterPlural}</div></div>
                          {lista.length ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                              {lista.map(s => {
                                const preco = Number(s.preco ?? 0); const promo = s.preco_promocional == null ? null : Number(s.preco_promocional);
                                return (
                                  <div key={s.id} className="bg-dark-100 border border-gray-800 rounded-custom p-5">
                                    <div className="flex justify-between items-start mb-3">
                                      {promo != null && promo > 0 && promo < preco ? (<div><div className="text-xl font-normal text-green-400">R$ {promo.toFixed(2)}</div><div className="text-xs font-normal text-red-400 line-through">R$ {preco.toFixed(2)}</div></div>) : (<div className="text-xl font-normal text-primary">R$ {preco.toFixed(2)}</div>)}
                                      <span className="text-xs text-gray-500">{s.duracao_minutos} MIN</span>
                                    </div>
                                    <h3 className="text-sm font-normal text-white mb-0.5">{s.nome}</h3>
                                    <p className="text-xs text-gray-500 mb-4">{p.nome}</p>
                                    <div className="flex gap-2">
                                      <button onClick={async () => {
                                        if (!await checarPermissao(s.profissional_id)) return;
                                        setEditingEntregaId(s.id);
                                        setFormEntrega({ nome: s.nome || '', duracao_minutos: String(s.duracao_minutos ?? ''), preco: String(s.preco ?? ''), preco_promocional: String(s.preco_promocional ?? ''), profissional_id: s.profissional_id || '' });
                                        setShowNovaEntrega(true);
                                      }} className="flex-1 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-button text-sm font-normal uppercase">EDITAR</button>
                                      <button onClick={() => deleteEntrega(s)} className="flex-1 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-button text-sm font-normal uppercase">EXCLUIR</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : <p className="text-gray-500">{emptyListMsg}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profissionais' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-normal">Profissionais</h2>
                  {/* Botão visível apenas para o admin que ainda não se cadastrou como profissional */}
                  {souDono && !adminJaEhProfissional && (
                    <button
                      onClick={cadastrarAdminComoProfissional}
                      disabled={submittingAdminProf}
                      className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-normal uppercase border transition-all ${submittingAdminProf ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary'}`}>
                      <Plus className="w-4 h-4" />
                      {submittingAdminProf ? 'CADASTRANDO...' : 'ME CADASTRAR'}
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {profissionais.map(p => {
                    const isPendente = p.status === 'pendente';
                    const isInativo  = p.status === 'inativo';
                    const isAtivo    = p.status === 'ativo';
                    const label      = normalizeKey(p.status_label);
                    const dotClass   = STATUS_COLOR_CLASS[label] || 'bg-gray-500';
                    const isEuMesmo  = parceiroProfissional?.id === p.id;
                    return (
                      <div key={p.id} className={`relative bg-dark-200 border rounded-custom p-5 ${isPendente ? 'border-yellow-500/40' : isEuMesmo ? 'border-primary/30' : 'border-gray-800'}`}>
                        {isPendente && (<div className="absolute top-3 right-3 text-[10px] px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-normal uppercase">AGUARDANDO</div>)}
                        {!isPendente && isInativo && (<span className="absolute top-3 right-3 text-[10px] px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-normal uppercase">INATIVO</span>)}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-custom flex items-center justify-center text-normal font-normal text-xl shrink-0">{p.nome?.[0] || 'P'}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-normal pr-24">{p.nome}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isPendente ? 'bg-yellow-400' : dotClass}`} />
                              <span className={`text-xs ${isPendente ? 'text-yellow-400' : 'text-gray-400'}`}>{isPendente ? 'PENDENTE' : (p.status_label || '—')}</span>
                            </div>
                            {p.profissao && <p className="text-xs text-gray-500 mt-1">{p.profissao}</p>}
                            {!isPendente && p.anos_experiencia != null && (<p className="text-xs text-gray-500 mt-1">{p.anos_experiencia} ANOS DE EXPERIÊNCIA</p>)}
                          </div>
                        </div>
                        {!isPendente && (
                          <>
                            <div className="text-sm text-gray-400 mb-3">{entregas.filter(s => s.profissional_id === p.id).length} {counterPlural}</div>
                            <div className="text-xs text-gray-500 mb-3">
                              <Clock className="w-4 h-4 inline mr-1" />{p.horario_inicio} - {p.horario_fim}
                              {p.almoco_inicio && p.almoco_fim && <span className="ml-2 text-yellow-300">• {p.almoco_inicio} - {p.almoco_fim}</span>}
                            </div>
                          </>
                        )}
                        {isPendente && !parceiroProfissional && (
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => aprovarParceiro(p)} className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-button text-sm font-normal uppercase">APROVAR</button>
                            <button onClick={() => excluirProfissional(p)} className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-button text-sm font-normal uppercase">EXCLUIR</button>
                          </div>
                        )}
                        {!isPendente && (isEuMesmo || !parceiroProfissional) && (
                          <>
                            {isInativo && p.motivo_inativo && (<div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-custom p-2 mb-3">INATIVO {p.motivo_inativo ? `• ${p.motivo_inativo}` : ''}</div>)}
                            {!parceiroProfissional ? (
                              <div className="space-y-2 mt-2">
                                <div className="flex gap-2">
                                  <button onClick={() => toggleStatusProfissional(p)} className={`flex-1 py-2 rounded-button text-sm border font-normal uppercase ${isAtivo ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-green-500/10 border-green-500/30 text-green-300'}`}>
                                    {isAtivo ? 'INATIVAR' : 'ATIVAR'}
                                  </button>
                                  <button onClick={() => excluirProfissional(p)} className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-button text-sm font-normal uppercase">EXCLUIR</button>
                                </div>
                                <button onClick={() => { setEditingProfissionalId(p.id); setFormProfissional({ nome: p.nome || '', profissao: p.profissao || '', anos_experiencia: String(p.anos_experiencia ?? ''), horario_inicio: p.horario_inicio || '08:00', horario_fim: p.horario_fim || '18:00', almoco_inicio: p.almoco_inicio || '', almoco_fim: p.almoco_fim || '', dias_trabalho: p.dias_trabalho || [1,2,3,4,5,6] }); setShowEditProfissional(true); }} className="w-full py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-button text-sm font-normal uppercase">EDITAR</button>
                              </div>
                            ) : isEuMesmo ? (
                              <button onClick={() => { setEditingProfissionalId(p.id); setFormProfissional({ nome: p.nome || '', profissao: p.profissao || '', anos_experiencia: String(p.anos_experiencia ?? ''), horario_inicio: p.horario_inicio || '08:00', horario_fim: p.horario_fim || '18:00', almoco_inicio: p.almoco_inicio || '', almoco_fim: p.almoco_fim || '', dias_trabalho: p.dias_trabalho || [1,2,3,4,5,6] }); setShowEditProfissional(true); }} className="w-full py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-button text-sm font-normal uppercase">EDITAR</button>
                            ) : null}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'info-negocio' && !parceiroProfissional && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-normal">Info do Negócio</h2>
                  <button onClick={salvarInfoNegocio} disabled={infoSaving}
                    className={`px-5 py-2.5 rounded-button font-normal border flex items-center gap-2 uppercase ${infoSaving ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'}`}>
                    <Save className="w-4 h-4" />{infoSaving ? 'SALVANDO...' : 'SALVAR'}
                  </button>
                </div>
                <div className="flex justify-start"><TemaToggle value={formInfo.tema} onChange={salvarTema} loading={temaSaving} /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><label className="block text-sm mb-2">Negócio</label><input value={formInfo.nome} onChange={(e) => setFormInfo(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="Nome" /></div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><label className="block text-sm mb-2">Telefone</label><input value={formInfo.telefone} onChange={(e) => setFormInfo(prev => ({ ...prev, telefone: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="(xx) xxxxx-xxxx" /></div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5 md:col-span-2"><label className="block text-sm mb-2">Endereço</label><input value={formInfo.endereco} onChange={(e) => setFormInfo(prev => ({ ...prev, endereco: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder='Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais' /><p className="text-[12px] text-yellow-300 mt-2">Use o formato: <span className="text-gray-300">"RUA, NÚMERO - CIDADE, ESTADO"</span><span className="text-gray-500"> Ex.: Rua Serra do Sincorá, 1038 - Belo Horizonte, Minas Gerais</span></p></div>
                  <div className="bg-dark-200 border border-gray-800 rounded-custom p-5 md:col-span-2"><label className="block text-sm mb-2">Sobre</label><textarea value={formInfo.descricao} onChange={(e) => setFormInfo(prev => ({ ...prev, descricao: e.target.value }))} rows={3} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white resize-none" placeholder="Sobre o negócio..." /></div>
                </div>
                <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                  <div className="text-sm font-normal text-white tracking-wide mb-1">REDES SOCIAIS</div>
                  <p className="text-sm text-gray-500 mb-4">Seus links aparecem na vitrine pública. Deixe em branco para ocultar.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm mb-2">Instagram</label><input value={formInfo.instagram} onChange={(e) => setFormInfo(prev => ({ ...prev, instagram: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="@seuinstagram" /></div>
                    <div><label className="block text-sm mb-2">Facebook</label><input value={formInfo.facebook} onChange={(e) => setFormInfo(prev => ({ ...prev, facebook: e.target.value }))} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="facebook.com/..." /></div>
                  </div>
                </div>
                <div className="bg-dark-200 border border-gray-800 rounded-custom p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-normal text-white tracking-wide">GALERIA</div>
                    <label className="hidden sm:inline-block">
                      <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
                      <span className={`inline-flex items-center gap-2 rounded-button font-normal border cursor-pointer transition-all uppercase ${galleryUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'} px-4 py-2 text-sm`}><Plus className="w-4 h-4" />{galleryUploading ? 'ENVIANDO...' : 'ADICIONAR'}</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Adicione fotos do seu espaço e serviços. Elas aparecem na sua vitrine pública para atrair novos clientes.</p>
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
                  <label className="sm:hidden mt-4 block">
                    <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
                    <span className={`w-full inline-flex items-center justify-center gap-2 rounded-button font-normal border cursor-pointer transition-all uppercase ${galleryUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'} px-4 py-3 text-sm`}><Plus className="w-4 h-4" />{galleryUploading ? 'ENVIANDO...' : 'ADICIONAR FOTOS'}</span>
                  </label>
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
                <div className="pt-2 pb-4">
                  <button type="button" onClick={() => navigate('/criar-negocio')} className="w-full py-4 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-normal uppercase tracking-normal hover:border-primary/70 hover:bg-primary/20 transition-all">
                    + CRIAR OUTRO NEGÓCIO
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

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
                  profissionais={parceiroProfissional ? profissionais.filter(p => p.id === parceiroProfissional.id) : profissionais}
                  placeholder="Selecione"
                  apenasAtivos={true}
                />
              </div>
              <div><label className="block text-sm mb-2">Nome</label><input type="text" value={formEntrega.nome} onChange={(e) => setFormEntrega({ ...formEntrega, nome: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
              <div><label className="block text-sm mb-2">Tempo estimado (min)</label><input type="number" value={formEntrega.duracao_minutos} onChange={(e) => setFormEntrega({ ...formEntrega, duracao_minutos: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
              <div><label className="block text-sm mb-2">Preço (R$)</label><input type="number" step="0.01" value={formEntrega.preco} onChange={(e) => setFormEntrega({ ...formEntrega, preco: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
              <div>
                <label className="block text-sm mb-2">Preço de OFERTA (opcional)</label>
                <input type="number" step="0.01" value={formEntrega.preco_promocional} onChange={(e) => setFormEntrega({ ...formEntrega, preco_promocional: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" placeholder="Apenas se houver oferta" />
                <p className="text-[12px] text-gray-500 mt-2">O preço de oferta deve ser menor que o preço normal.</p>
              </div>
              <button type="submit" disabled={submittingEntrega} className={`w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase ${submittingEntrega ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {submittingEntrega ? 'SALVANDO...' : editingEntregaId ? 'SALVAR' : getBizLabel(businessGroup, 'button_create')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditProfissional && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-normal">EDITAR PROFISSIONAL</h3>
              <button onClick={() => { setShowEditProfissional(false); setEditingProfissionalId(null); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={updateProfissional} className="space-y-4">
              <div><label className="block text-sm mb-2">Nome</label><input type="text" value={formProfissional.nome} onChange={(e) => setFormProfissional({ ...formProfissional, nome: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
              <div><label className="block text-sm mb-2">Profissão</label><input type="text" value={formProfissional.profissao} onChange={(e) => setFormProfissional({ ...formProfissional, profissao: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
              <div><label className="block text-sm mb-2">Anos de experiência</label><input type="number" value={formProfissional.anos_experiencia} onChange={(e) => setFormProfissional({ ...formProfissional, anos_experiencia: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-2">Início</label><input type="time" value={formProfissional.horario_inicio} onChange={(e) => setFormProfissional({ ...formProfissional, horario_inicio: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
                <div><label className="block text-sm mb-2">Fim</label><input type="time" value={formProfissional.horario_fim} onChange={(e) => setFormProfissional({ ...formProfissional, horario_fim: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-2">Almoço início</label><input type="time" value={formProfissional.almoco_inicio} onChange={(e) => setFormProfissional({ ...formProfissional, almoco_inicio: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
                <div><label className="block text-sm mb-2">Almoço fim</label><input type="time" value={formProfissional.almoco_fim} onChange={(e) => setFormProfissional({ ...formProfissional, almoco_fim: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
              </div>
              <div>
                <label className="block text-sm mb-2">Dias de trabalho</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(d => (
                    <button key={d.value} type="button"
                      onClick={() => { const dias = formProfissional.dias_trabalho.includes(d.value) ? formProfissional.dias_trabalho.filter(x => x !== d.value) : [...formProfissional.dias_trabalho, d.value].sort(); setFormProfissional({ ...formProfissional, dias_trabalho: dias }); }}
                      className={`px-3 py-1.5 rounded-button text-sm border font-normal uppercase transition-all ${formProfissional.dias_trabalho.includes(d.value) ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-700 text-gray-500'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submittingProfissional} className={`w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase ${submittingProfissional ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {submittingProfissional ? 'SALVANDO...' : 'SALVAR'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
