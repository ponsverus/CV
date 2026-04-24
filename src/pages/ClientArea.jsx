import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, History, LogOut, X } from 'lucide-react';
import { AgendamentosIcon } from '../components/icons';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';
import { convertImageToWebp, isImageFile } from '../utils/media';
import DepoimentoModal from './vitrine/components/DepoimentoModal';
import { createBookingReview, fetchReviewedBookings } from './clientArea/api/clientAreaApi';

function formatDateBRFromISO(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  if (!y || !m || !d) return String(dateStr);
  return `${d}.${m}.${y}`;
}

const moneyBR = (v) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0,00';
  return n.toFixed(2).replace('.', ',');
};

const getPrecoFinalEntrega = (e) => {
  const preco = Number(e?.preco ?? 0);
  const promoRaw = e?.preco_promocional;
  const promo = (promoRaw == null || promoRaw === '') ? 0 : Number(promoRaw);
  const temPromo = Number.isFinite(promo) && promo > 0 && promo < preco;
  return temPromo ? promo : preco;
};

const getValorAgendamento = (a) => {
  const frozen = Number(a?.preco_final);
  if (Number.isFinite(frozen) && frozen > 0) return frozen;
  return getPrecoFinalEntrega(a?.entregas);
};

const PAGE_SIZE = 50;

const maskedPrivateValue = '••••••••';

function HeartIcon({ filled = false, className = '', size = 20 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

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

export default function ClientArea({ user, onLogout }) {
  const navigate = useNavigate();
  const feedback = useFeedback();

  const uiAlert = useCallback((key, variant = 'info', params = {}) => {
    if (feedback?.showMessage) feedback.showMessage(key, { variant, ...params });
  }, [feedback]);

  const uiConfirm = async (key, variant = 'warning') => {
    return !!(await feedback.confirm(key, { variant }));
  };

  const [activeTab,       setActiveTab]       = useState('agendamentos');
  const [agendamentos,    setAgendamentos]    = useState([]);
  const [favoritos,       setFavoritos]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [agendamentosPage, setAgendamentosPage] = useState(0);
  const [favoritosPage, setFavoritosPage] = useState(0);
  const [agendamentosHasMore, setAgendamentosHasMore] = useState(false);
  const [favoritosHasMore, setFavoritosHasMore] = useState(false);
  const [agendamentosLoadingMore, setAgendamentosLoadingMore] = useState(false);
  const [favoritosLoadingMore, setFavoritosLoadingMore] = useState(false);

  const [avatarPath,      setAvatarPath]      = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [nomePerfil,   setNomePerfil]   = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [novoEmail,      setNovoEmail]      = useState(user?.email || '');
  const [novaSenha,      setNovaSenha]      = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingDados,    setSavingDados]    = useState(false);
  const [emailVisivel,   setEmailVisivel]   = useState(false);

  const [loadError, setLoadError] = useState('');
  const [avaliacoesPorAgendamento, setAvaliacoesPorAgendamento] = useState({});
  const [depoimentoModalOpen, setDepoimentoModalOpen] = useState(false);
  const [depoimentoLoading, setDepoimentoLoading] = useState(false);
  const [depoimentoAlvo, setDepoimentoAlvo] = useState(null);
  const [depoimentoNota, setDepoimentoNota] = useState(5);
  const [depoimentoTexto, setDepoimentoTexto] = useState('');

  useEffect(() => { setNovoEmail(user?.email || ''); }, [user?.email]);

  const fetchAgendamentos = useCallback(async ({ page = 0, limit = PAGE_SIZE } = {}) => {
    const { data, error } = await supabase.rpc('get_agendamentos_cliente', {
      p_cliente_id: user.id,
      p_limit: limit,
      p_offset: page * PAGE_SIZE,
    });
    if (error) throw error;
    return (data || []).map(a => ({
      ...a,
      preco_final:  a.preco_final ?? null,
      data:         String(a.data || ''),
      hora_inicio:  a.horario_inicio ? String(a.horario_inicio).slice(0, 5) : '',
      hora_fim:     a.horario_fim    ? String(a.horario_fim).slice(0, 5)    : '',
      entregas: {
        nome:              a.entrega_nome,
        preco:             a.entrega_preco,
        preco_promocional: a.entrega_promo,
      },
      profissionais: {
        nome:    a.profissional_nome,
        negocios: {
          nome:         a.negocio_nome,
          slug:         a.negocio_slug,
          logo_path:    a.negocio_logo_path,
          tipo_negocio: a.negocio_tipo,
        },
      },
    }));
  }, [user.id]);

  const fetchFavoritos = useCallback(async ({ page = 0, limit = PAGE_SIZE } = {}) => {
    const { data, error } = await supabase.rpc('get_favoritos_cliente', {
      p_cliente_id: user.id,
      p_limit: limit,
      p_offset: page * PAGE_SIZE,
    });
    if (error) throw error;
    return (data || []).map(f => ({
      ...f,
      negocios: f.tipo === 'negocio' && f.negocio_nome
        ? { nome: f.negocio_nome, slug: f.negocio_slug, logo_path: f.negocio_logo_path, tipo_negocio: f.negocio_tipo }
        : null,
      profissionais: f.tipo === 'profissional' && f.profissional_nome
        ? { nome: f.profissional_nome, negocios: f.profissional_negocio_slug ? { slug: f.profissional_negocio_slug } : null }
        : null,
    }));
  }, [user.id]);

  const syncAvaliacoesConcluidas = useCallback(async (agendamentosRows) => {
    const concluidosIds = (agendamentosRows || [])
      .filter((item) => String(item?.status || '') === 'concluido')
      .map((item) => item?.id)
      .filter(Boolean);

    if (!concluidosIds.length) {
      setAvaliacoesPorAgendamento({});
      return;
    }

    const reviews = await fetchReviewedBookings(concluidosIds);
    const nextMap = {};
    for (const review of reviews) {
      if (!review?.agendamento_id) continue;
      nextMap[review.agendamento_id] = review.id;
    }
    setAvaliacoesPorAgendamento(nextMap);
  }, []);

  const loadPerfil = useCallback(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('nome, avatar_path')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return { nome: String(data?.nome || '').trim(), avatarPath: data?.avatar_path || null };
  }, [user.id]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoadError('');
    setLoading(true);
    try {
      const [perfil, ags, favs] = await Promise.all([
        loadPerfil(),
        fetchAgendamentos(),
        fetchFavoritos(),
      ]);
      setNomePerfil(perfil.nome);
      setAvatarPath(perfil.avatarPath);
      setAgendamentos(ags);
      setFavoritos(favs);
      await syncAvaliacoesConcluidas(ags);
      setAgendamentosPage(0);
      setFavoritosPage(0);
      setAgendamentosHasMore(ags.length === PAGE_SIZE);
      setFavoritosHasMore(favs.length === PAGE_SIZE);
    } catch (error) {
      setLoadError(error?.message || 'Erro ao carregar dados.');
      setAgendamentos([]);
      setFavoritos([]);
      setAgendamentosPage(0);
      setFavoritosPage(0);
      setAgendamentosHasMore(false);
      setFavoritosHasMore(false);
      setAvaliacoesPorAgendamento({});
      uiAlert('alerts.action_failed_support', 'warning');
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPerfil, fetchAgendamentos, fetchFavoritos, syncAvaliacoesConcluidas, uiAlert]);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id, loadData]);

  const fetchAgendamentosRef = useRef(fetchAgendamentos);
  useEffect(() => { fetchAgendamentosRef.current = fetchAgendamentos; }, [fetchAgendamentos]);

  const agendamentosPageRef = useRef(agendamentosPage);
  useEffect(() => { agendamentosPageRef.current = agendamentosPage; }, [agendamentosPage]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`agendamentos_cliente:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos', filter: `cliente_id=eq.${user.id}` },
        async () => {
          try {
            const limit = (agendamentosPageRef.current + 1) * PAGE_SIZE;
            const ags = await fetchAgendamentosRef.current({ limit });
            setAgendamentos(ags);
            await syncAvaliacoesConcluidas(ags);
            setAgendamentosHasMore(ags.length === limit);
          } catch { }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [syncAvaliacoesConcluidas, user?.id]);

  const openFilePicker = () => fileInputRef.current?.click();

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const maxMb   = 3;
    if (!isImageFile(file)) { uiAlert('clientArea.avatar_invalid_format', 'error'); return; }
    if (file.size > maxMb * 1024 * 1024) { uiAlert('clientArea.avatar_too_large', 'error', { maxMb }); return; }
    try {
      setUploadingAvatar(true);
      const convertedFile = await convertImageToWebp(file);
      const oldPath = avatarPath || null;
      const path = `${user.id}/avatar.webp`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, convertedFile, { upsert: true, contentType: convertedFile.type });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase.from('users').update({ avatar_path: path }).eq('id', user.id);
      if (updErr) throw updErr;
      if (oldPath && oldPath !== path) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
      setAvatarPath(path);
      uiAlert('clientArea.avatar_updated', 'success');
    } catch {
      uiAlert('clientArea.avatar_update_error', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const salvarNome = async () => {
    const nome = String(nomePerfil || '').trim();
    if (!nome) { uiAlert('clientArea.profile_name_required', 'error'); return; }
    try {
      setSavingPerfil(true);
      const { error: updErr } = await supabase.from('users').update({ nome }).eq('id', user.id);
      if (updErr) throw updErr;
      const { error: metaErr } = await supabase.auth.updateUser({ data: { nome } });
      if (metaErr) { }
      uiAlert('clientArea.profile_name_updated', 'success');
    } catch {
      uiAlert('clientArea.profile_name_update_error', 'error');
    } finally {
      setSavingPerfil(false);
    }
  };

  const salvarEmail = async () => {
    const email = String(novoEmail || '').trim();
    if (!email || !email.includes('@')) { uiAlert('clientArea.account_email_invalid', 'error'); return; }
    try {
      setSavingDados(true);
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      uiAlert('clientArea.account_email_update_sent', 'success');
    } catch {
      uiAlert('clientArea.account_email_update_error', 'error');
    } finally {
      setSavingDados(false);
    }
  };

  const salvarEmailVisivel = async () => {
    await salvarEmail();
    setEmailVisivel(false);
  };

  const salvarSenha = async () => {
    const pass = String(novaSenha || '');
    const conf = String(confirmarSenha || '');
    if (pass.length < 6) { uiAlert('clientArea.account_password_too_short', 'error'); return; }
    if (pass !== conf)   { uiAlert('clientArea.account_password_mismatch',  'error'); return; }
    try {
      setSavingDados(true);
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      setNovaSenha('');
      setConfirmarSenha('');
      uiAlert('clientArea.account_password_updated', 'success');
    } catch {
      uiAlert('clientArea.account_password_update_error', 'error');
    } finally {
      setSavingDados(false);
    }
  };

  const cancelarAgendamento = async (agendamentoId) => {
    const ok = await uiConfirm('clientArea.booking_cancel_confirm', 'warning');
    if (!ok) return;
    try {
      const { error } = await supabase.rpc('cancelar_agendamento', { p_agendamento_id: agendamentoId });
      if (error) throw error;
      uiAlert('clientArea.booking_canceled', 'danger');
      const limit = (agendamentosPage + 1) * PAGE_SIZE;
      const ags = await fetchAgendamentos({ limit });
      setAgendamentos(ags);
      await syncAvaliacoesConcluidas(ags);
      setAgendamentosHasMore(ags.length === limit);
    } catch {
      uiAlert('clientArea.booking_cancel_error', 'error');
    }
  };

  const marcarNovamente = (agendamento) => {
    const slug = String(agendamento?.negocio_slug || '').trim();
    const profissionalId = agendamento?.profissional_id || null;
    const entregaId = agendamento?.entrega_id || null;
    if (!slug || !profissionalId || !entregaId) {
      uiAlert('alerts.action_failed_support', 'warning');
      return;
    }
    navigate(`/v/${slug}`, {
      state: {
        rebook: {
          profissionalId,
          entregaId,
        },
      },
    });
  };

  const abrirDepoimento = (agendamento) => {
    setDepoimentoAlvo(agendamento);
    setDepoimentoNota(5);
    setDepoimentoTexto('');
    setDepoimentoModalOpen(true);
  };

  const enviarDepoimentoAgendamento = async () => {
    if (!depoimentoAlvo?.id) return;
    try {
      setDepoimentoLoading(true);
      await createBookingReview({
        agendamentoId: depoimentoAlvo.id,
        nota: depoimentoNota,
        comentario: depoimentoTexto,
      });
      setAvaliacoesPorAgendamento((prev) => ({
        ...prev,
        [depoimentoAlvo.id]: true,
      }));
      setDepoimentoModalOpen(false);
      feedback.showMessage('vitrine.depoimento_sent', { variant: 'success' });
    } catch (e) {
      feedback.showCustom({
        title: 'Erro ao enviar depoimento',
        body: `Erro ao enviar seu depoimento: ${e?.message || ''}`,
        variant: 'danger',
        buttonText: 'OK',
      });
    } finally {
      setDepoimentoLoading(false);
    }
  };

  const removerFavorito = async (favoritoId) => {
    try {
      const { error } = await supabase.from('favoritos').delete().eq('id', favoritoId).eq('cliente_id', user.id);
      if (error) throw error;
      setFavoritos(prev => prev.filter(f => f.id !== favoritoId));
      uiAlert('clientArea.favorite_removed', 'success');
    } catch {
      uiAlert('clientArea.favorite_remove_error', 'error');
    }
  };

  const mergeById = (current, incoming) => {
    const seen = new Set();
    return [...current, ...incoming].filter(item => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const carregarMaisAgendamentos = async () => {
    if (agendamentosLoadingMore || !agendamentosHasMore) return;
    try {
      setAgendamentosLoadingMore(true);
      const nextPage = agendamentosPage + 1;
      const rows = await fetchAgendamentos({ page: nextPage });
      const merged = mergeById(agendamentos, rows);
      setAgendamentos(merged);
      await syncAvaliacoesConcluidas(merged);
      setAgendamentosPage(nextPage);
      setAgendamentosHasMore(rows.length === PAGE_SIZE);
    } catch {
      uiAlert('alerts.action_failed_support', 'warning');
    } finally {
      setAgendamentosLoadingMore(false);
    }
  };

  const carregarMaisFavoritos = async () => {
    if (favoritosLoadingMore || !favoritosHasMore) return;
    try {
      setFavoritosLoadingMore(true);
      const nextPage = favoritosPage + 1;
      const rows = await fetchFavoritos({ page: nextPage });
      setFavoritos(prev => mergeById(prev, rows));
      setFavoritosPage(nextPage);
      setFavoritosHasMore(rows.length === PAGE_SIZE);
    } catch {
      uiAlert('alerts.action_failed_support', 'warning');
    } finally {
      setFavoritosLoadingMore(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'agendado':               return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'concluido':              return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'cancelado_cliente':
      case 'cancelado_profissional': return 'bg-red-500/20 border-red-500/50 text-red-400';
      default:                       return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getStatusText = (status) => ({
    agendado:               'AGENDADO',
    concluido:              'CONCLUÍDO',
    cancelado_cliente:      'CANCELADO',
    cancelado_profissional: 'CANCELADO',
  }[status] || String(status || '').toUpperCase());

  const sortByDateThenTimeDesc = (list) =>
    [...(list || [])].sort((a, b) => {
      const da = String(a?.data || '');
      const db = String(b?.data || '');
      if (da !== db) return db.localeCompare(da);
      return String(b?.hora_inicio || '00:00').localeCompare(String(a?.hora_inicio || '00:00'));
    });

  const agendamentosPorStatus = useMemo(() => {
    const abertos = [], cancelados = [], concluidos = [];
    for (const a of (agendamentos || [])) {
      const st = String(a?.status || '');
      if (st === 'concluido')            concluidos.push(a);
      else if (st.includes('cancelado')) cancelados.push(a);
      else                               abertos.push(a);
    }
    return {
      abertos:    sortByDateThenTimeDesc(abertos),
      cancelados: sortByDateThenTimeDesc(cancelados),
      concluidos: sortByDateThenTimeDesc(concluidos),
    };
  }, [agendamentos]);

  const avatarUrl      = getPublicUrl('avatars', avatarPath);
  const nomeCabecalho  = String(nomePerfil || user?.user_metadata?.nome || '—').trim();
  const avatarFallback = nomeCabecalho?.[0]?.toUpperCase() || '?';
  const depoimentoModalStyles = {
    modalBg: 'bg-dark-100 border-gray-800',
    modalTitle: 'text-white',
    modalClose: 'text-gray-400 hover:text-white',
    modalLabel: 'text-gray-400',
    textarea: 'bg-dark-200 border-gray-800 text-white placeholder-gray-500 focus:border-primary',
    sendBtn: 'bg-gradient-to-r from-primary to-yellow-600 text-black',
  };
  const renderSecaoAgendamentos = (titulo, lista) => {
    if (!lista.length) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">{titulo}</div>
          <div className="text-xs text-gray-500">{lista.length}</div>
        </div>
        <div className="space-y-4">
          {lista.map(ag => {
            const podeMarcarNovamente =
              ['concluido', 'cancelado_cliente', 'cancelado_profissional'].includes(String(ag.status || '')) &&
              !!ag.negocio_slug &&
              !!ag.profissional_id &&
              !!ag.entrega_id;
            const podeAvaliar =
              String(ag.status || '') === 'concluido' &&
              !avaliacoesPorAgendamento[ag.id];
            return (
            <div key={ag.id} className="bg-dark-200 border border-gray-800 rounded-custom p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-normal text-white mb-1">{ag.profissionais?.negocios?.nome || '—'}</h3>
                  <p className="text-sm text-gray-400 mb-2">PROF: {ag.profissionais?.nome || '—'}</p>
                  <p className="text-sm text-primary">{ag.entregas?.nome || '—'}</p>
                </div>
                <div className={`shrink-0 inline-flex px-3 py-1 rounded-button text-xs border ${getStatusColor(ag.status)}`}>
                  {getStatusText(ag.status)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">DATA</div>
                  <div className="text-sm text-white">{formatDateBRFromISO(ag.data)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">HORÁRIO</div>
                  <div className="text-sm text-white">{ag.hora_inicio || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">VALOR</div>
                  <div className="text-sm text-white">R$ {moneyBR(getValorAgendamento(ag))}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {ag.status === 'agendado' && (
                  <button
                    onClick={() => cancelarAgendamento(ag.id)}
                    className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-button text-sm transition-all"
                  >
                    CANCELAR
                  </button>
                )}
                {podeMarcarNovamente && (
                  <button
                    onClick={() => marcarNovamente(ag)}
                    className="w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm transition-all uppercase"
                  >
                    AGENDAR NOVAMENTE
                  </button>
                )}
                {podeAvaliar && (
                  <button
                    onClick={() => abrirDepoimento(ag)}
                    className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-button text-sm transition-all uppercase"
                  >
                    DAR DEPOIMENTO
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary text-2xl animate-pulse">CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-dark-100 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-gray-800 bg-dark-200 flex items-center justify-center">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-white font-normal">{avatarFallback}</span>
                }
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-normal">MINHA ÁREA</h1>
                <p className="text-xs text-blue-400 -mt-1">CLIENTE</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
              <button onClick={openFilePicker} disabled={uploadingAvatar} className="h-9 px-5 bg-dark-200 border border-gray-800 hover:border-primary/50 rounded-button text-sm transition-all uppercase focus:outline-none">
                {uploadingAvatar ? 'ENVIANDO...' : 'FOTO'}
              </button>
              <button onClick={onLogout} className="h-9 flex items-center gap-2 px-5 bg-red-600 hover:bg-red-700 text-white rounded-button text-sm transition-all uppercase focus:outline-none">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">SAIR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/40 rounded-custom p-4 text-red-300 text-sm">
            {loadError}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-normal mb-2">Olá {nomeCabecalho} :)</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 items-start">
          <Link to="/" className="bg-gradient-to-r from-primary to-yellow-600 rounded-custom p-6 hover:shadow-lg hover:shadow-primary/50 transition-all">
            <AgendamentosIcon className="w-8 h-8 text-black mb-3" />
            <h3 className="text-lg font-normal text-black mb-1">NOVO AGENDAMENTO</h3>
          </Link>
          <button onClick={() => setActiveTab('favoritos')} className="bg-dark-100 border border-gray-800 rounded-custom p-6 hover:border-primary/50 transition-all text-left">
            <HeartIcon filled size={32} className="text-red-500 mb-3" />
            <h3 className="text-lg font-normal mb-1">{favoritos.length} FAVORITOS</h3>
          </button>
          <button onClick={() => setActiveTab('agendamentos')} className="bg-dark-100 border border-gray-800 rounded-custom p-6 hover:border-primary/50 transition-all text-left">
            <History className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-normal mb-1">{agendamentos.length} AGENDAMENTOS</h3>
          </button>
        </div>

        <div className="bg-dark-100 border border-gray-800 rounded-custom overflow-hidden">
          <div className="flex border-b border-gray-800">
            {['agendamentos', 'favoritos', 'dados'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 font-normal transition-all text-sm sm:text-base ${
                  activeTab === tab ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'agendamentos' ? 'AGENDAMENTOS' : tab === 'favoritos' ? 'FAVORITOS' : 'DADOS'}
              </button>
            ))}
          </div>

          <div className={activeTab === 'dados' ? '' : 'p-4 sm:p-6'}>

            {activeTab === 'agendamentos' && (
              <div>
                {(agendamentosPorStatus.abertos.length || agendamentosPorStatus.cancelados.length || agendamentosPorStatus.concluidos.length) ? (
                  <>
                    {renderSecaoAgendamentos('EM ABERTO',  agendamentosPorStatus.abertos)}
                    {renderSecaoAgendamentos('CONCLUÍDOS', agendamentosPorStatus.concluidos)}
                    {renderSecaoAgendamentos('CANCELADOS', agendamentosPorStatus.cancelados)}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AgendamentosIcon className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-40" />
                    <Link to="/" className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button hover:shadow-lg transition-all">
                      AGENDAR
                    </Link>
                  </div>
                )}
                {agendamentosHasMore && (
                  <button
                    type="button"
                    onClick={carregarMaisAgendamentos}
                    disabled={agendamentosLoadingMore}
                    className="mt-2 w-full py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {agendamentosLoadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'favoritos' && (
              <div>
                {favoritos.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    {favoritos.map(fav => {
                      const isNegocio   = fav.tipo === 'negocio';
                      const nomeFav     = isNegocio ? (fav.negocios?.nome || '—') : (fav.profissionais?.nome || '—');
                      const slug        = isNegocio ? fav.negocios?.slug : fav.profissionais?.negocios?.slug;
                      const tipoNegocio = isNegocio ? (String(fav.negocios?.tipo_negocio || '').trim() || '—') : 'PROFISSIONAL';
                      return (
                        <div key={fav.id} className="bg-dark-200 border border-gray-800 rounded-custom p-4 relative group hover:border-primary/50 transition-all">
                          <button onClick={() => removerFavorito(fav.id)} className="absolute top-2 right-2 w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                          <div className="mb-3">
                            <HeartIcon filled size={24} className="text-red-500 mb-3" />
                            <h3 className="text-lg font-normal text-white mb-1">{nomeFav}</h3>
                            <p className="text-xs text-gray-500 uppercase">{tipoNegocio}</p>
                          </div>
                          {slug && (
                            <Link to={`/v/${slug}`} className="block w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm text-center transition-all">
                              VER VITRINE
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HeartIcon filled size={64} className="text-red-500/30 mx-auto mb-4" />
                    <Link to="/" className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button hover:shadow-lg transition-all">
                      EXPLORAR
                    </Link>
                  </div>
                )}
                {favoritosHasMore && (
                  <button
                    type="button"
                    onClick={carregarMaisFavoritos}
                    disabled={favoritosLoadingMore}
                    className="mt-4 w-full py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {favoritosLoadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'dados' && (
              <>
                <div className="flex items-start gap-3 border-b border-gray-800 px-4 py-3 sm:px-6">
                  <span className="w-[74px] shrink-0 py-2 text-[14px] leading-5 text-gray-500">NOME</span>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={nomePerfil}
                      onChange={(e) => setNomePerfil(e.target.value)}
                      className="w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white"
                      placeholder="Nome do perfil"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={salvarNome}
                    disabled={savingPerfil}
                    className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[12px] font-normal uppercase text-primary disabled:opacity-50"
                  >
                    {savingPerfil ? 'SALVANDO' : 'SALVAR'}
                  </button>
                </div>

                <div className="flex items-start gap-3 border-b border-gray-800 px-4 py-3 sm:px-6">
                  <span className="w-[74px] shrink-0 py-2 text-[14px] leading-5 text-gray-500">E-MAIL</span>
                  <div className="min-w-0 flex-1">
                    <input
                      type={emailVisivel ? 'email' : 'text'}
                      value={emailVisivel ? novoEmail : maskedPrivateValue}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      readOnly={!emailVisivel}
                      className="w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white"
                      placeholder="E-mail de acesso"
                    />
                  </div>
                  {emailVisivel ? (
                    <button
                      type="button"
                      disabled={savingDados}
                      onClick={salvarEmailVisivel}
                      className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[12px] font-normal uppercase text-primary disabled:opacity-50"
                    >
                      {savingDados ? 'SALVANDO' : 'SALVAR'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEmailVisivel(true)}
                      className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[12px] font-normal uppercase text-primary disabled:opacity-50"
                    >
                      VER E-MAIL
                    </button>
                  )}
                </div>

                <div className="px-4 py-3 sm:px-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[14px] leading-5 text-gray-500">SENHA</span>
                    <button
                      type="button"
                      disabled={savingDados}
                      onClick={salvarSenha}
                      className="shrink-0 rounded-full border border-green-500/40 px-3 py-1 text-[12px] font-normal uppercase text-green-300 disabled:opacity-50"
                    >
                      {savingDados ? 'SALVANDO' : 'SALVAR'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full rounded-full border border-gray-800 bg-transparent px-4 py-2 text-center text-[14px] text-white placeholder-gray-600 outline-none focus:border-primary/50 focus:text-white"
                      placeholder="NOVA SENHA"
                    />
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="w-full rounded-full border border-gray-800 bg-transparent px-4 py-2 text-center text-[14px] text-white placeholder-gray-600 outline-none focus:border-primary/50 focus:text-white"
                      placeholder="CONFIRMAR"
                    />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      <DepoimentoModal
        open={depoimentoModalOpen}
        onClose={() => setDepoimentoModalOpen(false)}
        title="Deixe um depoimento para este profissional"
        styles={depoimentoModalStyles}
        state={{
          nota: depoimentoNota,
          texto: depoimentoTexto,
          loading: depoimentoLoading,
        }}
        actions={{
          setNota: setDepoimentoNota,
          setTexto: setDepoimentoTexto,
          onEnviar: enviarDepoimentoAgendamento,
        }}
        submitLabel="ENVIAR DEPOIMENTO"
        showSectionTitles
      />
    </div>
  );
}
