import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AgendamentosIcon, UsersIcon } from '../components/icons';
import {
  X, Eye,
  TrendingUp, Award, LogOut, AlertCircle,
} from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';
import { getBusinessGroup } from '../businessTerms';
import ProfissionalSelect from '../components/ProfissionalSelect';
import EntregaModal from './dashboard/components/EntregaModal';
import ProfissionalModal from './dashboard/components/ProfissionalModal';
import VisaoGeralSection from './dashboard/sections/VisaoGeralSection';
import AgendamentosSection from './dashboard/sections/AgendamentosSection';
import CanceladosSection from './dashboard/sections/CanceladosSection';
import HistoricoSection from './dashboard/sections/HistoricoSection';
import ClientesSection from './dashboard/sections/ClientesSection';
import EntregasSection from './dashboard/sections/EntregasSection';
import ProfissionaisSection from './dashboard/sections/ProfissionaisSection';
import InfoNegocioSection from './dashboard/sections/InfoNegocioSection';
import {
  NOW_RPC_SEQUENCE,
  SUPORTE_HREF,
  WEEKDAYS,
  compareAgendamentoDateTimeDesc,
  getAgDate,
  getAgInicio,
  getBizLabel,
  getValorAgendamento,
  getValorEntrega,
  isCancelStatus,
  sameDay,
  timeToMinutes,
} from './dashboard/utils';
import { getPublicUrl } from './dashboard/api/dashboardApi';
import { useDashboardBootstrap } from './dashboard/hooks/useDashboardBootstrap';
import { useDashboardClientes } from './dashboard/hooks/useDashboardClientes';
import { useDashboardHistorico } from './dashboard/hooks/useDashboardHistorico';
import { useDashboardMetrics } from './dashboard/hooks/useDashboardMetrics';
import { useDashboardMutations } from './dashboard/hooks/useDashboardMutations';

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

function formatDelta(value) {
  const number = Number(value || 0);
  if (number === 0) return '0';
  return `${number > 0 ? '+' : ''}${number}`;
}

function formatPercentDelta(value) {
  const number = Number(value || 0);
  if (number === 0) return '0.0%';
  return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`;
}

function TrendBadge({ data }) {
  const percent = data?.variacao_percentual;
  const delta = data?.variacao_valor;
  const hasPercent = percent !== null && percent !== undefined;
  const value = hasPercent ? Number(percent || 0) : Number(delta || 0);
  const tone = value > 0
    ? 'border-green-400/30 bg-green-400/10 text-green-400'
    : value < 0
      ? 'border-red-400/30 bg-red-400/10 text-red-400'
      : 'border-gray-700 bg-transparent text-gray-400';
  const text = hasPercent ? formatPercentDelta(percent) : formatDelta(delta);

  return (
    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tone}`}>
      {text}
    </div>
  );
}

function RevenueTrendBadge({ data }) {
  const percent = data?.variacao_percentual;
  const delta = data?.variacao_valor;
  const hasPercent = percent !== null && percent !== undefined;
  const value = hasPercent ? Number(percent || 0) : Number(delta || 0);
  const text = hasPercent ? formatPercentDelta(percent) : formatDelta(delta);
  const tone = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500';

  return (
    <div className={`inline-flex items-center rounded-full border border-white bg-white px-3 py-1 text-xs ${tone}`}>
      {text}
    </div>
  );
}

function InfoPill({ label, value, tone = 'text-gray-300', border = 'border-gray-700', bg = 'bg-transparent' }) {
  return (
    <div className={`inline-flex items-center justify-center gap-1.5 rounded-full border ${border} ${bg} px-3 py-1 text-xs`}>
      {label ? <span className="text-gray-500 uppercase">{label}</span> : null}
      <span className={tone}>{value}</span>
    </div>
  );
}

function DashboardTopCard({ icon, label, value, children, highlight = false }) {
  const baseClass = highlight
    ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30'
    : 'bg-dark-100 border-gray-800';

  return (
    <div className={`${baseClass} border rounded-custom p-6 min-h-[136px]`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {icon}
            <span className="text-sm text-gray-500">{label}</span>
          </div>
          <div className="text-3xl font-normal text-white mb-1">{value}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">{children}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = useFeedback();

  const uiAlert   = useCallback(async (key, variant = 'info') => { if (feedback?.showMessage) return feedback.showMessage(key, { variant }); return Promise.resolve(); }, [feedback]);
  const uiConfirm = useCallback(async (key, variant = 'warning') => { if (feedback?.confirm) return !!(await feedback.confirm(key, { variant })); return false; }, [feedback]);
  const uiPrompt  = useCallback(async (key, opts = {}) => { if (feedback?.prompt) return await feedback.prompt(key, opts); return null; }, [feedback]);

  const [activeTab, setActiveTab] = useState('agendamentos');
  const {
    parceiroProfissional,
    setParceiroProfissional,
    negocio,
    setNegocio,
    profissionais,
    setProfissionais,
    entregas,
    setEntregas,
    agendamentos,
    setAgendamentos,
    galeriaItems,
    setGaleriaItems,
    ownerBusinessCount,
    bootstrapState,
    error,
    serverNow,
    hoje,
    reloadNegocio,
    reloadProfissionais,
    reloadEntregas,
    reloadAgendamentos,
    reloadGaleria,
    reloadFull,
  } = useDashboardBootstrap({
    userId: user?.id,
    locationNegocioId: location?.state?.negocioId || null,
    navigate,
    rpcSequence: NOW_RPC_SEQUENCE,
    uiAlert,
  });
  const souDono = negocio?.owner_id === user?.id;
  const parceiroProfissionalId = parceiroProfissional?.id ?? null;
  const acessoDashboardAutorizado = souDono || !!parceiroProfissional;

  const checarPermissao = useCallback(async (profissionalId) => {
    if (!acessoDashboardAutorizado) {
      await uiAlert('dashboard.parceiro_acao_proibida', 'warning');
      return false;
    }
    if (!parceiroProfissional) return true;
    if (parceiroProfissional.id === profissionalId) return true;
    await uiAlert('dashboard.parceiro_acao_proibida', 'warning');
    return false;
  }, [acessoDashboardAutorizado, parceiroProfissional, uiAlert]);

  const agProfIds = useMemo(() => profissionais.map(p => p.id), [profissionais]);

  const [faturamentoData, setFaturamentoData]             = useState('');
  const [faturamentoPeriodo, setFaturamentoPeriodo]       = useState('7d');
  const {
    metricsHoje,
    metricsTopCards,
    metricsDia,
    metricsPeriodoData,
    metricsUtilizacao,
    metricsFutureBookings,
    metricsHojeLoading,
    metricsTopCardsLoading,
    metricsDiaLoading,
    metricsPeriodoLoading,
    metricsUtilizacaoLoading,
    metricsFutureBookingsLoading,
    loadHoje,
    loadTopCards,
    loadDia,
    loadPeriodo,
    loadUtilizacao,
    loadFutureBookings,
  } = useDashboardMetrics({
    negocioId: negocio?.id,
    hoje,
    faturamentoData,
    faturamentoPeriodo,
    parceiroProfissionalId,
  });

  const [showNovaEntrega, setShowNovaEntrega]       = useState(false);
  const [editingEntregaId, setEditingEntregaId]     = useState(null);

  const [formEntrega, setFormEntrega] = useState({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });

  const [formInfo, setFormInfo] = useState({ nome: '', descricao: '', telefone: '', endereco: '', instagram: '', facebook: '', tema: 'dark' });

  const [novoEmail, setNovoEmail]           = useState(user?.email || '');
  const [novaSenha, setNovaSenha]           = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [notifAgendamentos, setNotifAgendamentos] = useState(0);
  const [notifCancelados, setNotifCancelados]     = useState(0);

  const [showEditProfissional, setShowEditProfissional]       = useState(false);
  const [editingProfissionalId, setEditingProfissionalId]     = useState(null);
  const [formProfissional, setFormProfissional] = useState({ nome: '', profissao: '', anos_experiencia: '', horario_inicio: '08:00', horario_fim: '18:00', almoco_inicio: '', almoco_fim: '', dias_trabalho: [1,2,3,4,5,6] });


  useEffect(() => { setNovoEmail(user?.email || ''); }, [user?.email]);
  useEffect(() => {
    if (!negocio) return;
    setFormInfo({
      nome: negocio.nome || '',
      descricao: negocio.descricao || '',
      telefone: negocio.telefone || '',
      endereco: negocio.endereco || '',
      instagram: negocio.instagram || '',
      facebook: negocio.facebook || '',
      tema: negocio.tema || 'dark',
    });
  }, [negocio]);

  const businessGroup    = useMemo(() => getBusinessGroup(negocio?.tipo_negocio), [negocio?.tipo_negocio]);

  const tabEntregasLabel = useMemo(() => getBizLabel(businessGroup, 'tab_title').toUpperCase(), [businessGroup]);
  const sectionTitle     = useMemo(() => getBizLabel(businessGroup, 'tab_title'), [businessGroup]);
  const btnAddLabel      = useMemo(() => getBizLabel(businessGroup, 'button_add'), [businessGroup]);
  const modalNewLabel    = useMemo(() => getBizLabel(businessGroup, 'modal_new'), [businessGroup]);
  const modalEditLabel   = useMemo(() => getBizLabel(businessGroup, 'modal_edit'), [businessGroup]);
  const counterSingular  = useMemo(() => getBizLabel(businessGroup, 'counter_singular'), [businessGroup]);
  const counterPlural    = useMemo(() => getBizLabel(businessGroup, 'counter_plural'), [businessGroup]);
  const emptyListMsg     = useMemo(() => getBizLabel(businessGroup, 'empty_list'), [businessGroup]);

  const adminJaEhProfissional = useMemo(() =>
    profissionais.some(p => p.user_id === user?.id),
  [profissionais, user?.id]);

  const reloadAgendamentosRef = useRef(reloadAgendamentos);
  useEffect(() => { reloadAgendamentosRef.current = reloadAgendamentos; }, [reloadAgendamentos]);

  const agProfIdsKey = useMemo(() => profissionais.map(p => p.id).sort().join(','), [profissionais]);
  const {
    historicoAgendamentos,
    historicoHasMore,
    historicoLoadingMore,
    historicoData,
    setHistoricoData,
    loadMoreHistorico,
  } = useDashboardHistorico({
    negocioId: negocio?.id,
    hoje,
    agProfIds,
    parceiroProfissionalId,
    parceiroProfissional,
  });
  const {
    clientes,
    clientesLoading,
    clientesError,
    clientesHasMore,
    clientesLoadingMore,
    loadMoreClientes,
  } = useDashboardClientes({
    negocioId: negocio?.id,
  });

  const {
    logoUploading,
    infoSaving,
    temaSaving,
    galleryUploading,
    submittingEntrega,
    submittingProfissional,
    submittingAdminProf,
    savingDados,
    deletingBusiness,
    cadastrarAdminComoProfissional,
    uploadLogoNegocio,
    salvarInfoNegocio,
    salvarTema,
    excluirNegocio,
    uploadGaleria,
    removerImagemGaleria,
    createEntrega,
    updateEntrega,
    deleteEntrega,
    toggleStatusProfissional,
    excluirProfissional,
    updateProfissional,
    aprovarParceiro,
    confirmarAtendimento,
    cancelarAgendamento,
    salvarEmail,
    salvarSenha,
  } = useDashboardMutations({
    userId: user?.id,
    userEmail: user?.email,
    negocio,
    businessGroup,
    parceiroProfissional,
    reloadNegocio,
    reloadProfissionais,
      reloadEntregas,
      reloadAgendamentos,
      reloadGaleria,
      loadHoje,
      navigate,
      checarPermissao,
      uiAlert,
      uiConfirm,
    uiPrompt,
    setNegocio,
    setGaleriaItems,
    setEntregas,
    formInfo,
    setFormInfo,
    formEntrega,
    setFormEntrega,
    editingEntregaId,
    setEditingEntregaId,
    setShowNovaEntrega,
    formProfissional,
    editingProfissionalId,
    setEditingProfissionalId,
    setShowEditProfissional,
    novoEmail,
    setNovaSenha,
    setConfirmarSenha,
  });

  useEffect(() => {
    setFaturamentoData(prev => prev ? prev : hoje);
  }, [hoje]);

  useEffect(() => {
    if (!negocio?.id || !agProfIdsKey || !hoje) return;
    const channelName = parceiroProfissionalId
      ? `agendamentos:${negocio.id}:${parceiroProfissionalId}`
      : `agendamentos:${negocio.id}`;
    const channelFilter = parceiroProfissionalId
      ? `profissional_id=eq.${parceiroProfissionalId}`
      : `negocio_id=eq.${negocio.id}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos', filter: channelFilter }, (payload) => {
        const ev = payload?.eventType;
        const novo = payload?.new;
        const profIdEvento = novo?.profissional_id;
        const meuId = parceiroProfissionalId;
        const meResponde = !meuId || profIdEvento === meuId;
        if (ev === 'INSERT' && meResponde) setNotifAgendamentos(prev => prev + 1);
        if (ev === 'UPDATE' && meResponde) {
          const st = String(novo?.status || '').toLowerCase();
          if (st.includes('cancelado') && !st.includes('profissional')) setNotifCancelados(prev => prev + 1);
        }
        reloadAgendamentosRef.current();
        loadHoje(negocio.id, parceiroProfissionalId);
        loadTopCards(negocio.id, parceiroProfissionalId);
        loadUtilizacao(negocio.id, hoje, parceiroProfissionalId);
        loadFutureBookings(negocio.id, hoje, parceiroProfissionalId);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [negocio?.id, agProfIdsKey, hoje, parceiroProfissionalId, loadHoje, loadTopCards, loadUtilizacao, loadFutureBookings]);


  const agendamentosHoje = useMemo(() => {
    const base = agendamentos.filter(a => sameDay(getAgDate(a), hoje));
    if (!parceiroProfissionalId) return base;
    return base.filter(a => a.profissional_id === parceiroProfissionalId);
  }, [agendamentos, hoje, parceiroProfissionalId]);

  const hojeValidos    = useMemo(() => agendamentosHoje.filter(a => !isCancelStatus(a.status)), [agendamentosHoje]);
  const hojeCancelados = useMemo(() => agendamentosHoje.filter(a => isCancelStatus(a.status)), [agendamentosHoje]);

  const proximoAgendamento = useMemo(() => {
    const nowMin = Number(serverNow?.minutes || 0);
    return hojeValidos.filter(a => timeToMinutes(getAgInicio(a) || '00:00') >= nowMin).sort((a, b) => String(getAgInicio(a)).localeCompare(String(getAgInicio(b))))[0] || null;
  }, [hojeValidos, serverNow?.minutes]);

  const agendamentosAgrupadosPorProfissional = useMemo(() => {
    const fonte = parceiroProfissionalId
      ? agendamentos.filter(a => a.profissional_id === parceiroProfissionalId)
      : agendamentos;
    const map = new Map();
    for (const a of fonte) { const pid = a.profissional_id || a.profissionais?.id || 'sem-prof'; const nome = a.profissionais?.nome || 'PROFISSIONAL'; if (!map.has(pid)) map.set(pid, { pid, nome, itens: [] }); map.get(pid).itens.push(a); }
    const grupos = Array.from(map.values()).map(gr => ({ ...gr, itens: gr.itens.slice().sort(compareAgendamentoDateTimeDesc) }));
    const ordem = new Map((profissionais || []).map((p, idx) => [p.id, idx]));
    grupos.sort((a, b) => (ordem.get(a.pid) ?? 9999) - (ordem.get(b.pid) ?? 9999));
    return grupos;
  }, [agendamentos, profissionais, parceiroProfissionalId]);

  const entregasPorProf = useMemo(() => {
    const map = new Map(); for (const p of profissionais) map.set(p.id, []); for (const s of entregas) { if (!map.has(s.profissional_id)) map.set(s.profissional_id, []); map.get(s.profissional_id).push(s); } return map;
  }, [profissionais, entregas]);

  const faturamentoPorProfissionalHoje   = useMemo(() => { const arr = metricsHoje?.today?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsHoje]);
  const faturamentoPorProfissionalFiltro = useMemo(() => { const arr = metricsDia?.selected_day?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsDia]);
  const topFaturamento = metricsTopCards?.faturamento_hoje || {};
  const topAgendamentos = metricsTopCards?.agendamentos_hoje || {};
  const topProfissionais = metricsTopCards?.profissionais || {};
  const topEntregas = metricsTopCards?.entregas || {};
  const topCardsReady = !!metricsTopCards;

  const tabs = useMemo(() => (
    parceiroProfissional
      ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'clientes', 'entregas', 'profissionais']
      : souDono
        ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'clientes', 'entregas', 'profissionais', 'info-negocio']
        : ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'clientes', 'entregas', 'profissionais']
  ), [parceiroProfissional, souDono]);

  const TAB_LABELS = { 'visao-geral': 'GERAL', 'agendamentos': 'AGENDAMENTOS', 'cancelados': 'CANCELADOS', 'historico': 'HISTÓRICO', 'clientes': 'CLIENTES', 'entregas': tabEntregasLabel, 'profissionais': 'PROFISSIONAIS', 'info-negocio': 'INFO DO NEGÓCIO' };
  useEffect(() => {
    const requestedTab = location?.state?.activeTab;
    if (requestedTab && tabs.includes(requestedTab)) setActiveTab(requestedTab);
  }, [location?.state?.activeTab, tabs]);

  const agendarCliente = useCallback((cliente) => {
    if (!negocio?.slug || !cliente?.cliente_id) return;
    navigate(`/v/${negocio.slug}`, {
      state: {
        assistedBooking: {
          clienteId: cliente.cliente_id,
          clienteNome: cliente.cliente_nome || '',
          negocioId: negocio.id,
          returnTo: '/dashboard',
        },
      },
    });
  }, [navigate, negocio?.id, negocio?.slug]);
  const handleDashboardLogout = useCallback(() => onLogout(parceiroProfissional ? '/parceiro/login' : '/login'), [onLogout, parceiroProfissional]);

  if (bootstrapState === 'loading') return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-primary text-xl">CARREGANDO...</div>
      </div>
    </div>
  );

  if (bootstrapState === 'error' && error) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-100 border border-red-500/50 rounded-custom p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-normal text-white mb-2">Erro ao carregar</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={reloadFull} className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-button mb-3 font-normal uppercase">TENTAR NOVAMENTE</button>
        <button onClick={handleDashboardLogout} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-button font-normal uppercase">SAIR</button>
      </div>
    </div>
  );

  if (bootstrapState !== 'ready' || !negocio) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-primary text-xl">CARREGANDO...</div>
      </div>
    </div>
  );

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
                {souDono
                  ? ownerBusinessCount > 1
                    ? <button type="button" onClick={() => navigate('/selecionar-negocio')} className="text-xs text-gray-500 hover:text-primary transition-colors -mt-0.5 block">TROCAR NEGÓCIO</button>
                    : <span className="text-xs text-gray-500 -mt-0.5 block">DASHBOARD</span>
                  : <span className="text-xs text-primary -mt-0.5 block">{parceiroProfissional?.nome || 'PARCEIRO'}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to={`/v/${negocio.slug}`} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-200 border border-gray-800 hover:border-primary rounded-button text-sm font-normal uppercase">
                <Eye className="w-4 h-4" />VER VITRINE
              </Link>
              {souDono && (
                <label className="inline-block">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogoNegocio(e.target.files?.[0])} disabled={logoUploading} />
                  <span className={`inline-flex items-center justify-center text-center rounded-button font-normal border transition-all uppercase focus:outline-none ${logoUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer'}  px-4 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-sm`}>
                    <span className="sm:hidden">{logoUploading ? 'ENVIANDO...' : 'LOGO'}</span>
                    <span className="hidden sm:inline">{logoUploading ? 'ENVIANDO...' : 'ALTERAR LOGO'}</span>
                  </span>
                </label>
              )}
              <button onClick={handleDashboardLogout} className="flex items-center gap-2 px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 rounded-button text-sm font-normal uppercase">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">SAIR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 items-start">
          <DashboardTopCard
            highlight
            icon={<span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="text-green-400 font-normal text-3xl leading-none">$</span>}
            label="FATURAMENTO HOJE"
            value={metricsTopCardsLoading ? '...' : topCardsReady ? formatCurrency(topFaturamento.valor) : '--'}
          >
            {topCardsReady ? (
              <RevenueTrendBadge data={topFaturamento} />
            ) : null}
          </DashboardTopCard>

          <DashboardTopCard
            icon={<AgendamentosIcon className="w-8 h-8 text-blue-400" />}
            label="AGENDAMENTOS HOJE"
            value={metricsTopCardsLoading ? '...' : topCardsReady ? Number(topAgendamentos.total || 0) : '--'}
          >
            {topCardsReady ? (
              <TrendBadge data={topAgendamentos} />
            ) : null}
          </DashboardTopCard>

          <DashboardTopCard
            icon={<UsersIcon className="w-8 h-8 text-purple-400" />}
            label="PROFISSIONAIS"
            value={metricsTopCardsLoading ? '...' : topCardsReady ? Number(topProfissionais.total || 0) : '--'}
          >
            {topCardsReady ? (
              <InfoPill label="Ativos" value={Number(topProfissionais.ativos || 0)} />
            ) : null}
          </DashboardTopCard>

          <DashboardTopCard
            icon={<TrendingUp className="w-8 h-8 text-primary" />}
            label={tabEntregasLabel}
            value={metricsTopCardsLoading ? '...' : topCardsReady ? Number(topEntregas.total || 0) : '--'}
          >
            {topCardsReady ? (
              <InfoPill label="Média" value={formatCurrency(topEntregas.preco_medio)} />
            ) : null}
          </DashboardTopCard>
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
              <VisaoGeralSection
                metricsHoje={metricsHoje}
                proximoAgendamento={proximoAgendamento}
                souDono={souDono}
                faturamentoPorProfissionalHoje={faturamentoPorProfissionalHoje}
                faturamentoData={faturamentoData}
                setFaturamentoData={setFaturamentoData}
                hoje={hoje}
                metricsDiaLoading={metricsDiaLoading}
                metricsDia={metricsDia}
                faturamentoPorProfissionalFiltro={faturamentoPorProfissionalFiltro}
                faturamentoPeriodo={faturamentoPeriodo}
                setFaturamentoPeriodo={setFaturamentoPeriodo}
                metricsPeriodoData={metricsPeriodoData}
                metricsPeriodoLoading={metricsPeriodoLoading}
                metricsUtilizacao={metricsUtilizacao}
                metricsUtilizacaoLoading={metricsUtilizacaoLoading}
                metricsFutureBookings={metricsFutureBookings}
                metricsFutureBookingsLoading={metricsFutureBookingsLoading}
                counterSingular={counterSingular}
              />
            )}

            {activeTab === 'agendamentos' && (
              <AgendamentosSection
                agendamentosAgrupadosPorProfissional={agendamentosAgrupadosPorProfissional}
                hoje={hoje}
                confirmarAtendimento={confirmarAtendimento}
                cancelarAgendamento={cancelarAgendamento}
              />
            )}

            {activeTab === 'cancelados' && (
              <CanceladosSection hojeCancelados={hojeCancelados} />
            )}

            {activeTab === 'historico' && (
              <HistoricoSection
                historicoData={historicoData}
                setHistoricoData={setHistoricoData}
                hoje={hoje}
                historicoAgendamentos={historicoAgendamentos}
                historicoHasMore={historicoHasMore}
                loadMoreHistorico={loadMoreHistorico}
                historicoLoadingMore={historicoLoadingMore}
              />
            )}

            {activeTab === 'clientes' && (
              <ClientesSection
                clientes={clientes}
                clientesLoading={clientesLoading}
                clientesError={clientesError}
                clientesHasMore={clientesHasMore}
                clientesLoadingMore={clientesLoadingMore}
                loadMoreClientes={loadMoreClientes}
                onAgendarCliente={agendarCliente}
                itemLabel={counterSingular}
              />
            )}

            {activeTab === 'entregas' && (
              <EntregasSection
                sectionTitle={sectionTitle}
                parceiroProfissional={parceiroProfissional}
                setShowNovaEntrega={setShowNovaEntrega}
                setEditingEntregaId={setEditingEntregaId}
                setFormEntrega={setFormEntrega}
                btnAddLabel={btnAddLabel}
                profissionais={profissionais}
                entregasPorProf={entregasPorProf}
                counterSingular={counterSingular}
                counterPlural={counterPlural}
                emptyListMsg={emptyListMsg}
                checarPermissao={checarPermissao}
                deleteEntrega={deleteEntrega}
              />
            )}

            {activeTab === 'profissionais' && (
              <ProfissionaisSection
                souDono={souDono}
                currentUserId={user?.id ?? null}
                adminJaEhProfissional={adminJaEhProfissional}
                cadastrarAdminComoProfissional={cadastrarAdminComoProfissional}
                submittingAdminProf={submittingAdminProf}
                profissionais={profissionais}
                parceiroProfissional={parceiroProfissional}
                entregas={entregas}
                counterPlural={counterPlural}
                aprovarParceiro={aprovarParceiro}
                excluirProfissional={excluirProfissional}
                toggleStatusProfissional={toggleStatusProfissional}
                setEditingProfissionalId={setEditingProfissionalId}
                setFormProfissional={setFormProfissional}
                setShowEditProfissional={setShowEditProfissional}
              />
            )}

            {activeTab === 'info-negocio' && souDono && (
              <InfoNegocioSection
                salvarInfoNegocio={salvarInfoNegocio}
                infoSaving={infoSaving}
                formInfo={formInfo}
                setFormInfo={setFormInfo}
                salvarTema={salvarTema}
                temaSaving={temaSaving}
                galleryUploading={galleryUploading}
                uploadGaleria={uploadGaleria}
                galeriaItems={galeriaItems}
                getPublicUrl={getPublicUrl}
                removerImagemGaleria={removerImagemGaleria}
                novoEmail={novoEmail}
                setNovoEmail={setNovoEmail}
                savingDados={savingDados}
                salvarEmail={salvarEmail}
                novaSenha={novaSenha}
                setNovaSenha={setNovaSenha}
                  confirmarSenha={confirmarSenha}
                  setConfirmarSenha={setConfirmarSenha}
                  salvarSenha={() => salvarSenha(novaSenha, confirmarSenha)}
                  deletingBusiness={deletingBusiness}
                  excluirNegocio={excluirNegocio}
                  navigate={navigate}
                />
            )}

          </div>
        </div>
      </div>

      <EntregaModal
        show={showNovaEntrega}
        editingEntregaId={editingEntregaId}
        modalNewLabel={modalNewLabel}
        modalEditLabel={modalEditLabel}
        formEntrega={formEntrega}
        setFormEntrega={setFormEntrega}
        parceiroProfissional={parceiroProfissional}
        profissionais={profissionais}
        submittingEntrega={submittingEntrega}
        onClose={() => {
          setShowNovaEntrega(false);
          setEditingEntregaId(null);
          setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
        }}
        onSubmit={editingEntregaId ? updateEntrega : createEntrega}
      />

      <ProfissionalModal
        show={showEditProfissional}
        formProfissional={formProfissional}
        setFormProfissional={setFormProfissional}
        weekdays={WEEKDAYS}
        submittingProfissional={submittingProfissional}
        onClose={() => {
          setShowEditProfissional(false);
          setEditingProfissionalId(null);
        }}
        onSubmit={updateProfissional}
      />

    </div>
  );
}
