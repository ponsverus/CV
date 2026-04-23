import { useState } from 'react';
import { supabase } from '../../../supabase';
import { isEnderecoPadrao, toNumberOrNull, toUpperClean } from '../utils';
import { removeNegocioSeguramente, removeProfissionalSeguramente } from '../api/dashboardApi';
import { convertImageToWebp, isImageFile } from '../../../utils/media';

export function useDashboardMutations({
  userId,
  userEmail,
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
}) {
  const [logoUploading, setLogoUploading] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);
  const [temaSaving, setTemaSaving] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [submittingEntrega, setSubmittingEntrega] = useState(false);
  const [submittingProfissional, setSubmittingProfissional] = useState(false);
  const [submittingAdminProf, setSubmittingAdminProf] = useState(false);
  const [savingDados, setSavingDados] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState(false);

  const ensureOwnerAction = async () => {
    if (!negocio?.id) {
      await uiAlert('alerts.business_not_loaded', 'error');
      return false;
    }
    if (parceiroProfissional) {
      await uiAlert('dashboard.parceiro_acao_proibida', 'warning');
      return false;
    }
    return true;
  };

  const cadastrarAdminComoProfissional = async () => {
    if (!negocio?.id || !userId || submittingAdminProf) return;
    try {
      setSubmittingAdminProf(true);
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('nome')
        .eq('id', userId)
        .maybeSingle();
      if (userErr) throw userErr;
      const nome = String(userData?.nome || '').trim() || 'PROFISSIONAL';
      const { error: insErr } = await supabase.from('profissionais').insert([{
        negocio_id: negocio.id,
        user_id: userId,
        nome,
        status: 'ativo',
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
    if (!file || !userId) return;
    if (!(await ensureOwnerAction())) return;
    try {
      setLogoUploading(true);
      if (!isImageFile(file)) throw new Error('Formato invalido.');
      const convertedFile = await convertImageToWebp(file);
      const oldPath = negocio?.logo_path || null;
      const filePath = `${negocio.id}/logo.webp`;
      const { error: upErr } = await supabase.storage.from('logos').upload(filePath, convertedFile, { upsert: true, contentType: convertedFile.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from('negocios').update({ logo_path: filePath }).eq('id', negocio.id).eq('owner_id', userId);
      if (dbErr) throw dbErr;
      if (oldPath && String(oldPath).replace(/^logos\//, '') !== filePath) {
        const normalizedOldPath = String(oldPath).replace(/^logos\//, '');
        await supabase.storage.from('logos').remove([normalizedOldPath]);
      }
      await uiAlert('dashboard.logo_updated', 'success');
      await reloadNegocio();
    } catch {
      await uiAlert('dashboard.logo_update_error', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const salvarInfoNegocio = async () => {
    if (!(await ensureOwnerAction())) return;
    try {
      setInfoSaving(true);
      const endereco = String(formInfo.endereco || '').trim();
      if (endereco && !isEnderecoPadrao(endereco)) throw new Error('Endereco fora do padrao.');
      const payload = {
        nome: String(formInfo.nome || '').trim(),
        descricao: String(formInfo.descricao || '').trim(),
        telefone: String(formInfo.telefone || '').trim(),
        endereco,
        instagram: String(formInfo.instagram || '').trim() || null,
        facebook: String(formInfo.facebook || '').trim() || null,
        tema: formInfo.tema || 'dark',
      };
      const { error: updErr } = await supabase.from('negocios').update(payload).eq('id', negocio.id).eq('owner_id', userId);
      if (updErr) throw updErr;
      await uiAlert('dashboard.business_info_updated', 'success');
      await reloadNegocio();
    } catch (e) {
      if (String(e?.message || '').includes('padrao')) await uiAlert('dashboard.address_format_invalid', 'error');
      else await uiAlert('dashboard.business_info_update_error', 'error');
    } finally {
      setInfoSaving(false);
    }
  };

  const salvarTema = async (novoTema) => {
    if (!(await ensureOwnerAction())) return;
    setFormInfo((prev) => ({ ...prev, tema: novoTema }));
    try {
      setTemaSaving(true);
      const { error: updErr } = await supabase.from('negocios').update({ tema: novoTema }).eq('id', negocio.id).eq('owner_id', userId);
      if (updErr) throw updErr;
      setNegocio((prev) => (prev ? { ...prev, tema: novoTema } : prev));
    } catch {
      setFormInfo((prev) => ({ ...prev, tema: negocio?.tema || 'dark' }));
      await uiAlert('dashboard.business_info_update_error', 'error');
    } finally {
      setTemaSaving(false);
    }
  };

  const excluirNegocio = async () => {
    if (deletingBusiness) return;
    if (!(await ensureOwnerAction())) return;
    const ok = await uiConfirm('dashboard.business_delete_confirm', 'warning');
    if (!ok) return;
    try {
      setDeletingBusiness(true);
      const result = await removeNegocioSeguramente(negocio.id);
      await uiAlert('dashboard.business_deleted', 'success');

      const remaining = Number(result?.remaining_owner_businesses || 0);
      const accountDeleted = !!result?.account_deleted;

      if (accountDeleted) {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
        return;
      }

      if (remaining > 1) {
        navigate('/selecionar-negocio', { replace: true });
        return;
      }

      if (remaining === 1) {
        navigate('/dashboard', { replace: true });
        return;
      }

      navigate('/criar-negocio', { replace: true });
    } catch {
      await uiAlert('dashboard.business_delete_error', 'error');
    } finally {
      setDeletingBusiness(false);
    }
  };

  const uploadGaleria = async (files) => {
    if (!files?.length) return;
    if (!(await ensureOwnerAction())) return;
    try {
      setGalleryUploading(true);
      for (const file of Array.from(files)) {
        if (!isImageFile(file)) {
          await uiAlert('dashboard.gallery_invalid_format', 'error');
          continue;
        }
        if (file.size > 4 * 1024 * 1024) {
          await uiAlert('dashboard.gallery_too_large', 'error');
          continue;
        }
        const convertedFile = await convertImageToWebp(file);
        const filePath = `${negocio.id}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from('galerias').upload(filePath, convertedFile, { contentType: convertedFile.type });
        if (upErr) {
          await uiAlert('dashboard.gallery_upload_error', 'error');
          continue;
        }
        const { error: dbErr } = await supabase.from('galerias').insert({ negocio_id: negocio.id, path: filePath });
        if (dbErr) {
          await supabase.storage.from('galerias').remove([filePath]);
          await uiAlert('dashboard.gallery_upload_error', 'error');
        }
      }
      await uiAlert('dashboard.gallery_updated', 'success');
      await reloadGaleria();
    } catch {
      await uiAlert('dashboard.gallery_update_error', 'error');
    } finally {
      setGalleryUploading(false);
    }
  };

  const removerImagemGaleria = async (item) => {
    if (!(await ensureOwnerAction())) return;
    const ok = await uiConfirm('dashboard.gallery_remove_confirm', 'warning');
    if (!ok) return;
    try {
      const { error: dbErr } = await supabase.from('galerias').delete().eq('id', item.id);
      if (dbErr) throw dbErr;
      setGaleriaItems((prev) => prev.filter((x) => x.id !== item.id));
      await uiAlert('dashboard.gallery_image_removed', 'success');
    } catch {
      await uiAlert('dashboard.gallery_remove_error', 'error');
    }
  };

  const resetEntregaForm = () => {
    setShowNovaEntrega(false);
    setEditingEntregaId(null);
    setFormEntrega({ nome: '', duracao_minutos: '', preco: '', preco_promocional: '', profissional_id: '' });
  };

  const createEntrega = async (e) => {
    e.preventDefault();
    if (submittingEntrega) return;
    try {
      setSubmittingEntrega(true);
      if (!negocio?.id) throw new Error('Erro ao carregar o negocio');
      const profId = formEntrega.profissional_id;
      if (!await checarPermissao(profId)) return;
      const preco = toNumberOrNull(formEntrega.preco);
      const promo = toNumberOrNull(formEntrega.preco_promocional);
      if (preco == null) throw new Error('Preco invalido.');
      if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.');
      const payload = {
        nome: toUpperClean(formEntrega.nome),
        profissional_id: profId,
        duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos),
        preco,
        preco_promocional: promo,
        ativo: true,
        negocio_id: negocio.id,
      };
      if (!payload.nome) throw new Error('Nome da entrega e obrigatorio.');
      if (!payload.profissional_id) throw new Error('Selecione um profissional.');
      if (!payload.duracao_minutos) throw new Error('Duracao invalida.');
      const { error: insErr } = await supabase.from('entregas').insert([payload]);
      if (insErr) throw insErr;
      await uiAlert(`dashboard.business.${businessGroup}.entrega_created`, 'success');
      resetEntregaForm();
      await reloadEntregas();
    } catch (e2) {
      const msg = String(e2?.message || '');
      if (msg.includes('oferta')) await uiAlert('dashboard.entrega_promo_invalid', 'error');
      else if (msg.includes('invalido')) await uiAlert('dashboard.entrega_price_invalid', 'error');
      else if (msg.includes('Duracao')) await uiAlert('dashboard.entrega_duration_invalid', 'error');
      else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.entrega_prof_required`, 'error');
      else await uiAlert(`dashboard.business.${businessGroup}.entrega_create_error`, 'error');
    } finally {
      setSubmittingEntrega(false);
    }
  };

  const updateEntrega = async (e) => {
    e.preventDefault();
    if (submittingEntrega) return;
    try {
      setSubmittingEntrega(true);
      const profId = formEntrega.profissional_id;
      if (!await checarPermissao(profId)) return;
      const preco = toNumberOrNull(formEntrega.preco);
      const promo = toNumberOrNull(formEntrega.preco_promocional);
      if (!toUpperClean(formEntrega.nome)) throw new Error('Nome da entrega e obrigatorio.');
      if (!profId) throw new Error('Selecione um profissional.');
      if (!toNumberOrNull(formEntrega.duracao_minutos)) throw new Error('Duracao invalida.');
      if (preco == null) throw new Error('Preco invalido.');
      if (promo != null && promo >= preco) throw new Error('Preco de oferta deve ser menor.');
      const payload = {
        nome: toUpperClean(formEntrega.nome),
        duracao_minutos: toNumberOrNull(formEntrega.duracao_minutos),
        preco,
        preco_promocional: promo,
        profissional_id: profId,
      };
      const { error: updErr } = await supabase.from('entregas').update(payload).eq('id', editingEntregaId).eq('negocio_id', negocio.id);
      if (updErr) throw updErr;
      await uiAlert(`dashboard.business.${businessGroup}.entrega_updated`, 'success');
      resetEntregaForm();
      await reloadEntregas();
    } catch (e2) {
      const msg = String(e2?.message || '');
      if (msg.includes('oferta')) await uiAlert('dashboard.entrega_promo_invalid', 'error');
      else if (msg.includes('invalido')) await uiAlert('dashboard.entrega_price_invalid', 'error');
      else if (msg.includes('Duracao')) await uiAlert('dashboard.entrega_duration_invalid', 'error');
      else if (msg.includes('Selecione')) await uiAlert(`dashboard.business.${businessGroup}.entrega_prof_required`, 'error');
      else await uiAlert(`dashboard.business.${businessGroup}.entrega_update_error`, 'error');
    } finally {
      setSubmittingEntrega(false);
    }
  };

  const deleteEntrega = async (entrega) => {
    if (!await checarPermissao(entrega.profissional_id)) return;
    const ok = await uiConfirm(`dashboard.business.${businessGroup}.entrega_delete_confirm`, 'warning');
    if (!ok) return;
    try {
      const { error: delErr } = await supabase.from('entregas').delete().eq('id', entrega.id).eq('negocio_id', negocio.id);
      if (delErr) throw delErr;
      await uiAlert(`dashboard.business.${businessGroup}.entrega_deleted`, 'success');
      await reloadEntregas();
    } catch {
      await uiAlert(`dashboard.business.${businessGroup}.entrega_delete_error`, 'error');
    }
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
      const { error: upErr } = await supabase
        .from('profissionais')
        .update({ status: novoStatus, motivo_inativo: novoStatus === 'ativo' ? null : motivo })
        .eq('id', p.id)
        .eq('negocio_id', negocio.id);
      if (upErr) throw upErr;
      await uiAlert(novoStatus === 'ativo' ? 'dashboard.professional_activated' : 'dashboard.professional_inactivated', 'success');
      await reloadProfissionais();
    } catch {
      await uiAlert('dashboard.professional_toggle_error', 'error');
    }
  };

  const excluirProfissional = async (p) => {
    if (!await checarPermissao(p.id)) return;
    const ok = await uiConfirm('dashboard.professional_delete_confirm', 'warning');
    if (!ok) return;
    try {
      await removeProfissionalSeguramente(p.id);
      await uiAlert('dashboard.professional_deleted', 'success');
      const profs = await reloadProfissionais();
      if (profs?.length) await reloadEntregas(negocio.id, profs.map((item) => item.id));
      else setEntregas([]);
    } catch {
      await uiAlert('dashboard.professional_delete_error', 'error');
    }
  };

  const updateProfissional = async (e) => {
    e.preventDefault();
    if (submittingProfissional) return;
    try {
      setSubmittingProfissional(true);
      if (!await checarPermissao(editingProfissionalId)) return;
      const payload = {
        nome: String(formProfissional.nome || '').trim(),
        profissao: toUpperClean(formProfissional.profissao) || null,
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
      setShowEditProfissional(false);
      setEditingProfissionalId(null);
      await reloadProfissionais();
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('profissional_almoco_bloqueado')) await uiAlert('dashboard.professional_almoco_blocked', 'error');
      else if (msg.includes('profissional_dia_bloqueado')) await uiAlert('dashboard.professional_dia_blocked', 'error');
      else if (msg.includes('profissional_horario_bloqueado') || msg.includes('profissional_expediente_bloqueado')) await uiAlert('dashboard.professional_schedule_blocked', 'error');
      else await uiAlert('dashboard.professional_update_error', 'error');
    } finally {
      setSubmittingProfissional(false);
    }
  };

  const aprovarParceiro = async (prof) => {
    if (parceiroProfissional) {
      await uiAlert('dashboard.parceiro_acao_proibida', 'warning');
      return;
    }
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({
          status: 'ativo',
          motivo_inativo: null,
          inativado_em: null,
          inativado_por: null,
        })
        .eq('id', prof.id)
        .eq('negocio_id', negocio.id);
      if (error) throw error;
      await uiAlert('dashboard.professional_approved', 'success');
      await reloadProfissionais();
    } catch {
      await uiAlert('dashboard.partner_approve_error', 'error');
    }
  };

  const confirmarAtendimento = async (a) => {
    if (!await checarPermissao(a.profissional_id)) return;
    try {
      const { error } = await supabase.rpc('concluir_agendamento_profissional', { p_agendamento_id: a.id });
      if (error) throw error;
      await uiAlert('dashboard.booking_confirmed', 'success');
      await reloadAgendamentos();
      loadHoje(negocio.id, parceiroProfissional?.id ?? null);
    } catch {
      await uiAlert('dashboard.booking_confirm_error', 'error');
    }
  };

  const cancelarAgendamento = async (a) => {
    if (!await checarPermissao(a.profissional_id)) return;
    const ok = await uiConfirm('dashboard.booking_cancel_confirm', 'warning');
    if (!ok) return;
    try {
      const { error } = await supabase.rpc('cancelar_agendamento_profissional', { p_agendamento_id: a.id });
      if (error) throw error;
      await uiAlert('dashboard.booking_canceled', 'error');
      await reloadAgendamentos();
      loadHoje(negocio.id, parceiroProfissional?.id ?? null);
    } catch {
      await uiAlert('dashboard.booking_cancel_error', 'error');
    }
  };

  const salvarEmail = async () => {
    const email = String(novoEmail || '').trim();
    if (!email || !email.includes('@')) {
      await uiAlert('dashboard.account_email_invalid', 'error');
      return;
    }
    try {
      setSavingDados(true);
      const { error: updErr } = await supabase.auth.updateUser({ email });
      if (updErr) throw updErr;
      await uiAlert('dashboard.account_email_update_sent', 'success');
    } catch {
      await uiAlert('dashboard.account_email_update_error', 'error');
    } finally {
      setSavingDados(false);
    }
  };

  const salvarSenha = async (novaSenha, confirmarSenha) => {
    const pass = String(novaSenha || '');
    const conf = String(confirmarSenha || '');
    if (pass.length < 6) {
      await uiAlert('dashboard.account_password_too_short', 'error');
      return;
    }
    if (pass !== conf) {
      await uiAlert('dashboard.account_password_mismatch', 'error');
      return;
    }
    try {
      setSavingDados(true);
      const { error: updErr } = await supabase.auth.updateUser({ password: pass });
      if (updErr) throw updErr;
      setNovaSenha('');
      setConfirmarSenha('');
      await uiAlert('dashboard.account_password_updated', 'success');
    } catch {
      await uiAlert('dashboard.account_password_update_error', 'error');
    } finally {
      setSavingDados(false);
    }
  };

  return {
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
    salvarSenha: (novaSenha, confirmarSenha) => salvarSenha(novaSenha, confirmarSenha),
    currentEmail: userEmail || '',
  };
}
