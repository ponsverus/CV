import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { convertImageToWebp, isImageFile } from '../utils/media';
import { getPublicUrl, removeNegocioSeguramente } from './dashboard/api/dashboardApi';
import TemaToggle from './dashboard/components/TemaToggle';
import { useFeedback } from '../feedback/useFeedback';

function SettingRow({ label, value, hint, multiline = false, type = 'text', onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value || '');
  }, [editing, value]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-3 border-b border-[#13161f] px-4 py-3 sm:px-6">
      <span className="w-24 shrink-0 pt-0.5 text-[13px] text-[#4a5568]">{label}</span>

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {multiline ? (
            <textarea
              className="min-h-20 w-full resize-y rounded-[7px] border border-[#1e2235] bg-[#111420] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-primary/50"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          ) : (
            <input
              className="w-full rounded-[7px] border border-[#1e2235] bg-[#111420] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-primary/50"
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          )}
          {hint ? <p className="text-[10px] text-[#4a5568]">{hint}</p> : null}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-full border border-primary/30 px-3 py-1 text-[11px] text-primary disabled:opacity-50">
              {saving ? 'salvando' : 'salvar'}
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="text-[11px] text-[#4a5568] disabled:opacity-50">
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="min-w-0 flex-1 break-words text-[13px] leading-5 text-[#94a3b8]">{value || <span className="text-[#2e3248]">-</span>}</span>
          <button type="button" onClick={() => { setDraft(value || ''); setEditing(true); }} className="shrink-0 pt-0.5 text-[11px] text-primary">
            editar
          </button>
        </>
      )}
    </div>
  );
}

function PasswordRow({ onSave }) {
  const [editing, setEditing] = useState(false);
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNova('');
    setConfirmar('');
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(nova, confirmar);
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-3 border-b border-[#13161f] px-4 py-3 sm:px-6">
      <span className="w-24 shrink-0 pt-0.5 text-[13px] text-[#4a5568]">Senha</span>
      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input className="w-full rounded-[7px] border border-[#1e2235] bg-[#111420] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-primary/50" type="password" placeholder="Nova senha" value={nova} onChange={(e) => setNova(e.target.value)} autoFocus />
          <input className="w-full rounded-[7px] border border-[#1e2235] bg-[#111420] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-primary/50" type="password" placeholder="Confirmar nova senha" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-full border border-primary/30 px-3 py-1 text-[11px] text-primary disabled:opacity-50">
              {saving ? 'salvando' : 'salvar'}
            </button>
            <button type="button" onClick={reset} disabled={saving} className="text-[11px] text-[#4a5568] disabled:opacity-50">
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="min-w-0 flex-1 text-[13px] leading-5 text-[#94a3b8]">••••••••</span>
          <button type="button" onClick={() => setEditing(true)} className="shrink-0 pt-0.5 text-[11px] text-primary">
            editar
          </button>
        </>
      )}
    </div>
  );
}

function GroupLabel({ children }) {
  return (
    <div className="border-t border-[#13161f] px-4 pb-1 pt-4 text-[10px] uppercase tracking-[0.1em] text-[#2e3248] sm:px-6">
      {children}
    </div>
  );
}

export default function NegocioSettings({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = useFeedback();

  const [negocio, setNegocio] = useState(null);
  const [galeriaItems, setGaleriaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [temaSaving, setTemaSaving] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState(false);
  const [novoEmail, setNovoEmail] = useState(user?.email || '');

  useEffect(() => { setNovoEmail(user?.email || ''); }, [user?.email]);

  const negocioIdFromState = location.state?.negocioId || null;

  const showMessage = useCallback((key, variant = 'info') => {
    if (feedback?.showMessage) return feedback.showMessage(key, { variant });
    return null;
  }, [feedback]);

  const confirmMessage = useCallback(async (key, variant = 'warning') => {
    if (feedback?.confirm) return !!(await feedback.confirm(key, { variant }));
    return window.confirm('Confirmar acao?');
  }, [feedback]);

  const loadGaleria = useCallback(async (negocioId) => {
    const { data, error } = await supabase
      .from('galerias')
      .select('id, path, ordem')
      .eq('negocio_id', negocioId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    setGaleriaItems(data || []);
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError('');
    try {
      let negocioData = null;

      if (negocioIdFromState) {
        const { data, error } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', negocioIdFromState)
          .eq('owner_id', user.id)
          .maybeSingle();
        if (error) throw error;
        negocioData = data;
      } else {
        const { count, error: countErr } = await supabase
          .from('negocios')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user.id);
        if (countErr) throw countErr;
        if (Number(count || 0) > 1) {
          navigate('/selecionar-negocio', { replace: true });
          return;
        }
        const { data, error } = await supabase
          .from('negocios')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (error) throw error;
        negocioData = data;
      }

      if (!negocioData) {
        setLoadError('Negocio nao encontrado.');
        setNegocio(null);
        setGaleriaItems([]);
        return;
      }

      setNegocio(negocioData);
      await loadGaleria(negocioData.id);
    } catch (e) {
      setLoadError(e?.message || 'Erro ao carregar informacoes.');
    } finally {
      setLoading(false);
    }
  }, [loadGaleria, navigate, negocioIdFromState, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const voltarDashboard = () => {
    navigate('/dashboard', { state: negocio?.id ? { negocioId: negocio.id } : location.state?.dashboardState || {} });
  };

  const updateNegocio = async (field, value) => {
    if (!negocio?.id) return;
    const payload = { [field]: value };
    const { error } = await supabase
      .from('negocios')
      .update(payload)
      .eq('id', negocio.id)
      .eq('owner_id', user.id);
    if (error) throw error;
    setNegocio((prev) => prev ? { ...prev, ...payload } : prev);
    showMessage('dashboard.business_info_updated', 'success');
  };

  const salvarTema = async (novoTema) => {
    if (!negocio?.id || temaSaving) return;
    const temaAnterior = negocio.tema || 'dark';
    setNegocio((prev) => prev ? { ...prev, tema: novoTema } : prev);
    try {
      setTemaSaving(true);
      await updateNegocio('tema', novoTema);
    } catch {
      setNegocio((prev) => prev ? { ...prev, tema: temaAnterior } : prev);
      showMessage('dashboard.business_info_update_error', 'error');
    } finally {
      setTemaSaving(false);
    }
  };

  const uploadGaleria = async (files) => {
    if (!files?.length || !negocio?.id) return;
    try {
      setGalleryUploading(true);
      for (const file of Array.from(files)) {
        if (!isImageFile(file)) {
          showMessage('dashboard.gallery_invalid_format', 'error');
          continue;
        }
        if (file.size > 4 * 1024 * 1024) {
          showMessage('dashboard.gallery_too_large', 'error');
          continue;
        }
        const convertedFile = await convertImageToWebp(file);
        const filePath = `${negocio.id}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from('galerias').upload(filePath, convertedFile, { contentType: convertedFile.type });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from('galerias').insert({ negocio_id: negocio.id, path: `galerias/${filePath}` });
        if (dbErr) {
          await supabase.storage.from('galerias').remove([filePath]);
          throw dbErr;
        }
      }
      showMessage('dashboard.gallery_updated', 'success');
      await loadGaleria(negocio.id);
    } catch {
      showMessage('dashboard.gallery_update_error', 'error');
    } finally {
      setGalleryUploading(false);
    }
  };

  const removerImagemGaleria = async (item) => {
    const ok = await confirmMessage('dashboard.gallery_remove_confirm', 'warning');
    if (!ok) return;
    try {
      const { error } = await supabase.from('galerias').delete().eq('id', item.id);
      if (error) throw error;
      setGaleriaItems((prev) => prev.filter((x) => x.id !== item.id));
      showMessage('dashboard.gallery_image_removed', 'success');
    } catch {
      showMessage('dashboard.gallery_remove_error', 'error');
    }
  };

  const salvarEmail = async (email) => {
    const clean = String(email || '').trim();
    if (!clean || !clean.includes('@')) {
      showMessage('dashboard.account_email_invalid', 'error');
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: clean });
    if (error) throw error;
    setNovoEmail(clean);
    showMessage('dashboard.account_email_update_sent', 'success');
  };

  const salvarSenha = async (novaSenha, confirmarSenha) => {
    const pass = String(novaSenha || '');
    const conf = String(confirmarSenha || '');
    if (pass.length < 6) {
      showMessage('dashboard.account_password_too_short', 'error');
      return;
    }
    if (pass !== conf) {
      showMessage('dashboard.account_password_mismatch', 'error');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) throw error;
    showMessage('dashboard.account_password_updated', 'success');
  };

  const excluirNegocio = async () => {
    if (!negocio?.id || deletingBusiness) return;
    const ok = await confirmMessage('dashboard.business_delete_confirm', 'warning');
    if (!ok) return;
    try {
      setDeletingBusiness(true);
      const result = await removeNegocioSeguramente(negocio.id);
      showMessage('dashboard.business_deleted', 'success');
      if (result?.account_deleted) {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
        return;
      }
      const remaining = Number(result?.remaining_owner_businesses || 0);
      if (remaining > 1) navigate('/selecionar-negocio', { replace: true });
      else if (remaining === 1) navigate('/dashboard', { replace: true });
      else navigate('/criar-negocio', { replace: true });
    } catch {
      showMessage('dashboard.business_delete_error', 'error');
    } finally {
      setDeletingBusiness(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b12] flex items-center justify-center text-primary">
        CARREGANDO...
      </div>
    );
  }

  if (loadError || !negocio) {
    return (
      <div className="min-h-screen bg-[#090b12] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md border border-red-500/40 bg-[#0d0f18] p-8 text-center">
          <p className="mb-6 text-gray-400">{loadError || 'Negocio nao encontrado.'}</p>
          <button type="button" onClick={voltarDashboard} className="rounded-full border border-primary/40 px-6 py-3 text-primary">
            VOLTAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b12] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[8px] border border-[#13161f] bg-[#0d0f18]">
        <div className="flex items-center justify-between gap-4 border-b border-[#13161f] px-4 py-4 sm:px-6">
          <button type="button" onClick={voltarDashboard} className="inline-flex items-center gap-2 text-[13px] text-[#94a3b8] hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            voltar
          </button>
          <span className="text-[14px] font-normal text-[#e2e8f0]">Info do negócio</span>
          <Link to={`/v/${negocio.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[13px] text-[#94a3b8] hover:text-primary">
            vitrine
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <GroupLabel>Geral</GroupLabel>
        <SettingRow label="Nome" value={negocio.nome || ''} onSave={(value) => updateNegocio('nome', String(value || '').trim())} />
        <SettingRow label="Telefone" value={negocio.telefone || ''} onSave={(value) => updateNegocio('telefone', String(value || '').trim())} />
        <SettingRow label="Endereço" value={negocio.endereco || ''} hint="Formato: RUA, NÚMERO - CIDADE, ESTADO" onSave={(value) => updateNegocio('endereco', String(value || '').trim())} />
        <SettingRow label="Sobre" value={negocio.descricao || ''} multiline onSave={(value) => updateNegocio('descricao', String(value || '').trim())} />

        <GroupLabel>Redes</GroupLabel>
        <SettingRow label="Instagram" value={negocio.instagram || ''} onSave={(value) => updateNegocio('instagram', String(value || '').trim() || null)} />
        <SettingRow label="Facebook" value={negocio.facebook || ''} onSave={(value) => updateNegocio('facebook', String(value || '').trim() || null)} />

        <GroupLabel>Aparência</GroupLabel>
        <div className="flex items-start gap-3 border-b border-[#13161f] px-4 py-3 sm:px-6">
          <span className="w-24 shrink-0 pt-1 text-[13px] text-[#4a5568]">Tema</span>
          <div className="min-w-0 flex-1">
            <TemaToggle value={negocio.tema || 'dark'} onChange={salvarTema} loading={temaSaving} />
          </div>
        </div>

        <GroupLabel>Galeria</GroupLabel>
        <div className="border-b border-[#13161f] px-4 py-4 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-[13px] text-[#94a3b8]">{galeriaItems.length ? `${galeriaItems.length} imagem(ns)` : 'Nenhuma imagem ainda'}</span>
            <label>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadGaleria(e.target.files)} disabled={galleryUploading} />
              <span className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${galleryUploading ? 'border-gray-800 text-gray-600' : 'border-primary/30 text-primary'}`}>
                <Plus className="h-3.5 w-3.5" />
                {galleryUploading ? 'enviando' : 'adicionar'}
              </span>
            </label>
          </div>
          {galeriaItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {galeriaItems.map((item) => (
                <div key={item.id || item.path} className="relative overflow-hidden rounded-[7px] border border-[#1e2235] bg-[#111420]">
                  <img src={getPublicUrl('galerias', item.path)} alt="Galeria" className="aspect-square w-full object-cover" loading="lazy" />
                  <button type="button" onClick={() => removerImagemGaleria(item)} className="absolute bottom-2 left-2 right-2 rounded-full border border-red-400/30 bg-black/70 py-1 text-[10px] uppercase text-red-300">
                    remover
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <GroupLabel>Credenciais</GroupLabel>
        <SettingRow label="E-mail" type="email" value={novoEmail} onSave={salvarEmail} />
        <PasswordRow onSave={salvarSenha} />

        <GroupLabel>Zona de perigo</GroupLabel>
        <div className="flex items-start gap-3 border-b border-[#13161f] px-4 py-3 sm:px-6">
          <span className="w-24 shrink-0 pt-0.5 text-[13px] text-[#4a5568]">Negócio</span>
          <span className="min-w-0 flex-1 text-[13px] leading-5 text-red-400">Excluir permanentemente</span>
          <button type="button" onClick={excluirNegocio} disabled={deletingBusiness} className="shrink-0 rounded-full border border-red-500/30 px-3 py-1 text-[11px] text-red-400 disabled:opacity-50">
            {deletingBusiness ? 'excluindo' : 'excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
