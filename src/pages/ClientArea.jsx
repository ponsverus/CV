import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, History, LogOut, X, Save } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedback } from '../feedback/useFeedback';

function formatDateBRFromISO(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-');
  if (!y || !m || !d) return String(dateStr);
  return `${d}.${m}.${y}`;
}

function getNowSP_localFallback() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const get = (type) => parts.find(p => p.type === type)?.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, source: 'local' };
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

function toYMD_SP(ts) {
  if (!ts) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(ts));
  } catch { return ''; }
}

function toHHMM_SP(ts) {
  if (!ts) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(ts));
  } catch { return ''; }
}

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
  const stripped = path.replace(new RegExp(`^${bucket}/`), '');
  const { data } = supabase.storage.from(bucket).getPublicUrl(stripped);
  return data?.publicUrl || null;
}

export default function ClientArea({ user, onLogout }) {
  const feedback = useFeedback?.();

  const uiAlert = async (key, variant = 'info', params = {}) => {
    if (feedback?.showMessage) { feedback.showMessage(key, { variant, ...params }); return; }
  };

  const uiConfirm = async (key, variant = 'warning') => {
    if (feedback?.confirm) return !!(await feedback.confirm(key, { variant }));
    return window.confirm('Confirmar?');
  };

  const [activeTab,      setActiveTab]      = useState('agendamentos');
  const [agendamentos,   setAgendamentos]   = useState([]);
  const [favoritos,      setFavoritos]      = useState([]);
  const [loading,        setLoading]        = useState(true);

  const [avatarPath,     setAvatarPath]     = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [nomePerfil,   setNomePerfil]   = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [novoEmail,      setNovoEmail]      = useState(user?.email || '');
  const [novaSenha,      setNovaSenha]      = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingDados,    setSavingDados]    = useState(false);

  const [loadError, setLoadError] = useState('');

  useEffect(() => { setNovoEmail(user?.email || ''); }, [user?.email]);

  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  const fetchAgendamentosRaw = async () => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('cliente_id', user.id)
      .order('data',           { ascending: false })
      .order('horario_inicio', { ascending: false })
      .order('id',             { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const montarAgendamentosComMaps = async (agList) => {
    const list = agList || [];

    const entregaIds = uniq(list.map(a => a.entrega_id));
    const profIds    = uniq(list.map(a => a.profissional_id));

    let entregasMap = new Map();
    if (entregaIds.length) {
      const { data, error } = await supabase
        .from('entregas')
        .select('id, nome, preco, preco_promocional')
        .in('id', entregaIds);
      if (error) throw error;
      for (const e of (data || [])) entregasMap.set(e.id, e);
    }

    let profissionaisMap = new Map();
    let negocioIds = [];
    if (profIds.length) {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, nome, negocio_id, ativo')
        .in('id', profIds);
      if (error) throw error;
      negocioIds = uniq((data || []).map(p => p.negocio_id));
      for (const p of (data || [])) profissionaisMap.set(p.id, p);
    }

    let negociosMap = new Map();
    if (negocioIds.length) {
      const { data, error } = await supabase
        .from('negocios')
        .select('id, nome, slug, logo_path, tipo_negocio')
        .in('id', negocioIds);
      if (error) throw error;
      for (const n of (data || [])) negociosMap.set(n.id, n);
    }

    return list.map(a => {
      const entrega = entregasMap.get(a.entrega_id) || null;
      const prof    = profissionaisMap.get(a.profissional_id) || null;
      const neg     = prof?.negocio_id ? (negociosMap.get(prof.negocio_id) || null) : null;
      return {
        ...a,
        data:         a.data || toYMD_SP(a.inicio),
        hora_inicio:  a.horario_inicio ? String(a.horario_inicio).slice(0, 5) : toHHMM_SP(a.inicio),
        hora_fim:     a.horario_fim    ? String(a.horario_fim).slice(0, 5)    : toHHMM_SP(a.fim),
        entregas:     entrega,
        profissionais: prof ? { ...prof, negocios: neg } : null,
      };
    });
  };

  const loadData = async () => {
    if (!user?.id) return;
    setLoadError('');
    setLoading(true);
    try {
      const { data: uRow, error: uErr } = await supabase
        .from('users')
        .select('nome, avatar_path')
        .eq('id', user.id)
        .maybeSingle();
      if (uErr) throw uErr;

      setNomePerfil(String(uRow?.nome || '').trim());
      setAvatarPath(uRow?.avatar_path || null);

      const agRaw   = await fetchAgendamentosRaw();
      const agFinal = await montarAgendamentosComMaps(agRaw);
      setAgendamentos(agFinal);

      const { data: favRaw, error: favErr } = await supabase
        .from('favoritos').select('*').eq('cliente_id', user.id);
      if (favErr) throw favErr;

      const favList    = favRaw || [];
      const favNegIds  = uniq(favList.filter(f => f.tipo === 'negocio').map(f => f.negocio_id));
      const favProfIds = uniq(favList.filter(f => f.tipo === 'profissional').map(f => f.profissional_id));

      let favProfMap = new Map();
      let favNegFromProf = [];
      if (favProfIds.length) {
        const { data, error } = await supabase
          .from('profissionais')
          .select('id, nome, negocio_id, ativo, avatar_path')
          .in('id', favProfIds);
        if (error) throw error;
        favNegFromProf = uniq((data || []).map(p => p.negocio_id));
        for (const p of (data || [])) favProfMap.set(p.id, p);
      }

      const allFavNegIds = uniq([...favNegIds, ...favNegFromProf]);
      let favNegMap = new Map();
      if (allFavNegIds.length) {
        const { data, error } = await supabase
          .from('negocios')
          .select('id, nome, slug, logo_path, tipo_negocio')
          .in('id', allFavNegIds);
        if (error) throw error;
        for (const n of (data || [])) favNegMap.set(n.id, n);
      }

      const favFinal = favList.map(f => {
        const prof        = f.tipo === 'profissional' ? (favProfMap.get(f.profissional_id) || null) : null;
        const negDirect   = f.tipo === 'negocio'      ? (favNegMap.get(f.negocio_id)       || null) : null;
        const negFromProf = prof?.negocio_id          ? (favNegMap.get(prof.negocio_id)    || null) : null;
        return {
          ...f,
          negocios:      negDirect,
          profissionais: prof ? { ...prof, negocios: negFromProf } : null,
        };
      });

      setFavoritos(favFinal);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoadError(error?.message || 'Erro ao carregar dados.');
      setAgendamentos([]);
      setFavoritos([]);
      await uiAlert('alerts.action_failed_support', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`agendamentos_cliente:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos', filter: `cliente_id=eq.${user.id}` },
        () => { loadData(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const openFilePicker = () => fileInputRef.current?.click();

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const maxMb   = 3;
    const okTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!okTypes.includes(file.type)) { await uiAlert('clientArea.avatar_invalid_format', 'error'); return; }
    if (file.size > maxMb * 1024 * 1024) { await uiAlert('clientArea.avatar_too_large', 'error', { maxMb }); return; }
    try {
      setUploadingAvatar(true);
      const path = `${user.id}/avatar.webp`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase.from('users').update({ avatar_path: path }).eq('id', user.id);
      if (updErr) throw updErr;
      setAvatarPath(path);
      await uiAlert('clientArea.avatar_updated', 'success');
    } catch (err) {
      console.error('Erro ao atualizar avatar:', err);
      await uiAlert('clientArea.avatar_update_error', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const salvarNome = async () => {
    const nome = String(nomePerfil || '').trim();
    if (!nome) { await uiAlert('clientArea.profile_name_required', 'error'); return; }
    try {
      setSavingPerfil(true);
      const { error: updErr } = await supabase.from('users').update({ nome }).eq('id', user.id);
      if (updErr) throw updErr;
      const { error: metaErr } = await supabase.auth.updateUser({ data: { nome } });
      if (metaErr) console.warn('metaErr:', metaErr);
      await uiAlert('clientArea.profile_name_updated', 'success');
      await loadData();
    } catch (e) {
      console.error('Erro ao salvar nome:', e);
      await uiAlert('clientArea.profile_name_update_error', 'error');
    } finally {
      setSavingPerfil(false);
    }
  };

  const salvarEmail = async () => {
    const email = String(novoEmail || '').trim();
    if (!email || !email.includes('@')) { await uiAlert('clientArea.account_email_invalid', 'error'); return; }
    try {
      setSavingDados(true);
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      await uiAlert('clientArea.account_email_update_sent', 'success');
      await loadData();
    } catch (e) {
      console.error('Erro ao alterar email:', e);
      await uiAlert('clientArea.account_email_update_error', 'error');
    } finally {
      setSavingDados(false);
    }
  };

  const salvarSenha = async () => {
    const pass = String(novaSenha || '');
    const conf = String(confirmarSenha || '');
    if (pass.length < 6) { await uiAlert('clientArea.account_password_too_short', 'error'); return; }
    if (pass !== conf)   { await uiAlert('clientArea.account_password_mismatch',  'error'); return; }
    try {
      setSavingDados(true);
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      setNovaSenha('');
      setConfirmarSenha('');
      await uiAlert('clientArea.account_password_updated', 'success');
    } catch (e) {
      console.error('Erro ao alterar senha:', e);
      await uiAlert('clientArea.account_password_update_error', 'error');
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
      await uiAlert('clientArea.booking_canceled', 'danger');
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      await uiAlert('clientArea.booking_cancel_error', 'error');
    }
  };

  const removerFavorito = async (favoritoId) => {
    try {
      const { error } = await supabase.from('favoritos').delete().eq('id', favoritoId).eq('cliente_id', user.id);
      if (error) throw error;
      setFavoritos(favoritos.filter(f => f.id !== favoritoId));
      await uiAlert('clientArea.favorite_removed', 'success');
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      await uiAlert('clientArea.favorite_remove_error', 'error');
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

  const sortByDateThenTime = (list) =>
    [...(list || [])].sort((a, b) => {
      const da = String(a?.data || '');
      const db = String(b?.data || '');
      if (da !== db) return da.localeCompare(db);
      return String(a?.hora_inicio || '99:99').localeCompare(String(b?.hora_inicio || '99:99'));
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
      abertos:    sortByDateThenTime(abertos),
      cancelados: sortByDateThenTime(cancelados),
      concluidos: sortByDateThenTime(concluidos),
    };
  }, [agendamentos]);

  const avatarUrl      = getPublicUrl('avatars', avatarPath);
  const nomeCabecalho  = String(nomePerfil || user?.user_metadata?.nome || '—').trim();
  const avatarFallback = nomeCabecalho?.[0]?.toUpperCase() || '?';

  const renderSecaoAgendamentos = (titulo, lista) => {
    if (!lista.length) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">{titulo}</div>
          <div className="text-xs text-gray-500">{lista.length}</div>
        </div>
        <div className="space-y-4">
          {lista.map(ag => (
            <div key={ag.id} className="bg-dark-200 border border-gray-800 rounded-custom p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-normal text-white mb-1">{ag.profissionais?.negocios?.nome || '—'}</h3>
                  <p className="text-sm text-gray-400 mb-2">{ag.profissionais?.nome || '—'}</p>
                  <p className="text-sm text-primary">{ag.entregas?.nome || '—'}</p>
                </div>
                <div className={`shrink-0 inline-flex px-3 py-1 rounded-button text-xs border ${getStatusColor(ag.status)}`}>
                  {getStatusText(ag.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
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
                  <div className="text-sm text-white">R$ {moneyBR(getPrecoFinalEntrega(ag.entregas))}</div>
                </div>
              </div>
              {ag.status === 'agendado' && (
                <button
                  onClick={() => cancelarAgendamento(ag.id)}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-button text-sm transition-all"
                >
                  CANCELAR
                </button>
              )}
            </div>
          ))}
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
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickAvatar} className="hidden" />
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link to="/" className="bg-gradient-to-r from-primary to-yellow-600 rounded-custom p-6 hover:shadow-lg hover:shadow-primary/50 transition-all">
            <Calendar className="w-8 h-8 text-black mb-3" />
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

          <div className="p-4 sm:p-6">

            {activeTab === 'agendamentos' && (
              <div>
                {(agendamentosPorStatus.abertos.length || agendamentosPorStatus.cancelados.length || agendamentosPorStatus.concluidos.length) ? (
                  <>
                    {renderSecaoAgendamentos('EM ABERTO',  agendamentosPorStatus.abertos)}
                    {renderSecaoAgendamentos('CANCELADOS', agendamentosPorStatus.cancelados)}
                    {renderSecaoAgendamentos('CONCLUÍDOS', agendamentosPorStatus.concluidos)}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <Link to="/" className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button hover:shadow-lg transition-all">
                      AGENDAR
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favoritos' && (
              <div>
                {favoritos.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </div>
            )}

            {activeTab === 'dados' && (
              <div className="space-y-6">
                <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-xs text-gray-500">PERFIL</div>
                    <button
                      type="button"
                      onClick={salvarNome}
                      disabled={savingPerfil}
                      className={`px-4 py-2 rounded-button font-normal border flex items-center gap-2 uppercase ${
                        savingPerfil ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {savingPerfil ? 'SALVANDO...' : 'SALVAR'}
                    </button>
                  </div>
                  <label className="block text-sm mb-2">NOME</label>
                  <input type="text" value={nomePerfil} onChange={(e) => setNomePerfil(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" />
                </div>

                <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
                  <div className="text-xs text-gray-500 mb-4">CONTA</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">EMAIL</label>
                      <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" />
                      <button type="button" disabled={savingDados} onClick={salvarEmail} className="mt-3 w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        SALVAR EMAIL
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">SENHA</label>
                      <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="••••••••" />
                      <label className="block text-sm mb-2 mt-3">CONFIRMAR</label>
                      <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full px-4 py-3 bg-dark-100 border border-gray-800 rounded-custom text-white" placeholder="••••••••" />
                      <button type="button" disabled={savingDados} onClick={salvarSenha} className="mt-3 w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 rounded-button text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        SALVAR SENHA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
