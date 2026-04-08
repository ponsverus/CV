
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  X, Eye, Calendar,
  Users, TrendingUp, Award, LogOut, AlertCircle,
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
import EntregasSection from './dashboard/sections/EntregasSection';
import ProfissionaisSection from './dashboard/sections/ProfissionaisSection';
import InfoNegocioSection from './dashboard/sections/InfoNegocioSection';
import {
  NOW_RPC_SEQUENCE,
  SUPORTE_HREF,
  WEEKDAYS,
  getAgDate,
  getAgInicio,
  getBizLabel,
  getImageExt,
  getValorAgendamento,
  getValorEntrega,
  isCancelStatus,
  isEnderecoPadrao,
  sameDay,
  timeToMinutes,
  toNumberOrNull,
  toUpperClean,
} from './dashboard/utils';
import { getPublicUrl } from './dashboard/api/dashboardApi';
import { useDashboardBootstrap } from './dashboard/hooks/useDashboardBootstrap';
import { useDashboardHistorico } from './dashboard/hooks/useDashboardHistorico';
import { useDashboardMetrics } from './dashboard/hooks/useDashboardMetrics';

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
    metricsDia,
    metricsPeriodoData,
    metricsUtilizacao,
    metricsFutureBookings,
    metricsHojeLoading,
    metricsDiaLoading,
    metricsPeriodoLoading,
    metricsUtilizacaoLoading,
    metricsFutureBookingsLoading,
    loadHoje,
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
  const [submittingEntrega, setSubmittingEntrega]   = useState(false);
  const [editingEntregaId, setEditingEntregaId]     = useState(null);
  const [logoUploading, setLogoUploading]           = useState(false);

  const [formEntrega, setFormEntrega] = useState({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });

  const [infoSaving, setInfoSaving]             = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
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

  const [submittingAdminProf, setSubmittingAdminProf] = useState(false);


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

  useEffect(() => {
    setFaturamentoData(prev => prev ? prev : hoje);
  }, [hoje]);

  useEffect(() => {
    if (!negocio?.id || !agProfIdsKey || !hoje) return;
    const channel = supabase.channel(`agendamentos:${negocio.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos', filter: `negocio_id=eq.${negocio.id}` }, (payload) => {
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
        loadUtilizacao(negocio.id, hoje, parceiroProfissionalId);
        loadFutureBookings(negocio.id, hoje, parceiroProfissionalId);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [negocio?.id, agProfIdsKey, hoje, parceiroProfissionalId, loadHoje, loadUtilizacao, loadFutureBookings]);

  const cadastrarAdminComoProfissional = async () => {
    if (!negocio?.id || !user?.id || submittingAdminProf) return;
    try {
      setSubmittingAdminProf(true);

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
      const ext = getImageExt(file);
      if (!ext) throw new Error('Formato invalido.');
      const filePath = `${negocio.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true, contentType: file.type });
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
        const ext = getImageExt(file);
        if (!ext) { await uiAlert('dashboard.gallery_invalid_format', 'error'); continue; }
        const filePath = `${negocio.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('galerias').upload(filePath, file, { contentType: file.type });
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
      else if (msg.includes('profissional_horario_bloqueado') || msg.includes('profissional_expediente_bloqueado')) await uiAlert('dashboard.professional_schedule_blocked', 'error');
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
      const { error } = await supabase.rpc('concluir_agendamento_profissional', { p_agendamento_id: a.id });
      if (error) throw error;
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
    const grupos = Array.from(map.values()).map(gr => ({ ...gr, itens: gr.itens.slice().sort((a, b) => { const d = String(getAgDate(a) || '').localeCompare(String(getAgDate(b) || '')); if (d !== 0) return d; const h = String(getAgInicio(a) || '').localeCompare(String(getAgInicio(b) || '')); if (h !== 0) return h; return String(a.id || '').localeCompare(String(b.id || '')); }) }));
    const ordem = new Map((profissionais || []).map((p, idx) => [p.id, idx]));
    grupos.sort((a, b) => (ordem.get(a.pid) ?? 9999) - (ordem.get(b.pid) ?? 9999));
    return grupos;
  }, [agendamentos, profissionais, parceiroProfissionalId]);

  const entregasPorProf = useMemo(() => {
    const map = new Map(); for (const p of profissionais) map.set(p.id, []); for (const s of entregas) { if (!map.has(s.profissional_id)) map.set(s.profissional_id, []); map.get(s.profissional_id).push(s); } return map;
  }, [profissionais, entregas]);

  const faturamentoPorProfissionalHoje   = useMemo(() => { const arr = metricsHoje?.today?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsHoje]);
  const faturamentoPorProfissionalFiltro = useMemo(() => { const arr = metricsDia?.selected_day?.por_profissional || []; if (!Array.isArray(arr)) return []; return arr.map(x => { if (!x) return null; const nome = String(x.nome ?? '').trim(); const valor = Number(x.faturamento ?? x.valor ?? 0); if (!nome) return null; return [nome, Number.isFinite(valor) ? valor : 0]; }).filter(Boolean).sort((a, b) => Number(b[1]) - Number(a[1])); }, [metricsDia]);

  const tabs = parceiroProfissional
    ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais']
    : souDono
      ? ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais', 'info-negocio']
      : ['visao-geral', 'agendamentos', 'cancelados', 'historico', 'entregas', 'profissionais'];

  const TAB_LABELS = { 'visao-geral': 'GERAL', 'agendamentos': 'AGENDAMENTOS', 'cancelados': 'CANCELADOS', 'historico': 'HISTÓRICO', 'entregas': tabEntregasLabel, 'profissionais': 'PROFISSIONAIS', 'info-negocio': 'INFO DO NEGÓCIO' };
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
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => uploadLogoNegocio(e.target.files?.[0])} disabled={logoUploading} />
                  <span className={`inline-flex items-center justify-center text-center rounded-button font-normal border transition-all uppercase focus:outline-none ${logoUploading ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer'}  px-4 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-sm`}>
                    <span className="sm:hidden">{logoUploading ? '...' : 'LOGO'}</span>
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
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-custom p-6">
            <div className="mb-2 flex items-center gap-2">
              <span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="text-green-400 font-normal text-3xl leading-none">$</span>
              <span className="text-sm text-gray-500">FATURAMENTO HOJE</span>
            </div>
            <div className="text-3xl font-normal text-white mb-1">R$ {Number(metricsHoje?.today?.faturamento || 0).toFixed(2)}</div>
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
                reloadAgendamentos={reloadAgendamentos}
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
                salvarSenha={salvarSenha}
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
