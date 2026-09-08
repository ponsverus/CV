import { useCallback, useMemo } from 'react';
import {
  getProfissionalStatusDotClass,
  getProfissionalStatusLabel,
  resolveProfissionalStatusKey,
} from '../../../utils/profissionalStatus';

export function useVitrinePresentation({
  negocio,
  profissionais,
  entregas,
  entregaPagesByProf = {},
  depoimentos,
  galeriaItems,
  isProfessional,
  isFavorito,
  depoimentoNota,
  serverNow,
  getPublicUrl,
  getPrecoFinalEntrega,
  getDowFromDateSP,
  resolveInstagram,
  resolveFacebook,
}) {
  const logoUrl = useMemo(() => getPublicUrl('logos', negocio?.logo_path), [getPublicUrl, negocio?.logo_path]);
  const instagramUrl = useMemo(() => resolveInstagram(negocio?.instagram), [negocio?.instagram, resolveInstagram]);
  const facebookUrl = useMemo(() => resolveFacebook(negocio?.facebook), [negocio?.facebook, resolveFacebook]);

  const getHorarioDia = useCallback((p, dow) => {
    if (Array.isArray(p?.horarios) && dow != null) {
      const item = p.horarios.find((h) => Number(h?.dia_semana) === Number(dow));
      if (item) return item;
    }
    return null;
  }, []);

  const getHorarioExibicao = useCallback((p) => {
    const hojeDow = serverNow.date ? getDowFromDateSP(serverNow.date) : null;
    const horarioHoje = getHorarioDia(p, hojeDow);
    if (horarioHoje?.ativo !== false && horarioHoje?.horario_inicio && horarioHoje?.horario_fim) return horarioHoje;
    if (Array.isArray(p?.horarios)) {
      const primeiroAtivo = p.horarios.find((h) => h?.ativo !== false);
      if (primeiroAtivo) return primeiroAtivo;
    }
    return {
      ativo: true,
      horario_inicio: '08:00',
      horario_fim: '18:00',
      almoco_inicio: null,
      almoco_fim: null,
    };
  }, [getDowFromDateSP, getHorarioDia, serverNow.date]);

  const getAlmocoRange = useCallback((p) => {
    const horario = getHorarioExibicao(p);
    return { ini: horario?.almoco_inicio || null, fim: horario?.almoco_fim || null };
  }, [getHorarioExibicao]);

  const entregasPorProf = useMemo(() => {
    const map = new Map();
    for (const p of profissionais) map.set(p.id, []);
    for (const s of entregas) {
      if (!map.has(s.profissional_id)) map.set(s.profissional_id, []);
      map.get(s.profissional_id).push(s);
    }
    return map;
  }, [profissionais, entregas]);

  const depoimentosPorProf = useMemo(() => {
    const map = new Map();
    for (const dep of depoimentos) {
      if (!dep.profissional_id) continue;
      if (!map.has(dep.profissional_id)) map.set(dep.profissional_id, []);
      map.get(dep.profissional_id).push(dep);
    }
    const medias = new Map();
    for (const [profId, deps] of map.entries()) {
      const media = deps.length > 0 ? (deps.reduce((sum, d) => sum + d.nota, 0) / deps.length).toFixed(1) : null;
      medias.set(profId, { media, count: deps.length });
    }
    return medias;
  }, [depoimentos]);

  const depoimentosView = useMemo(() => (
    depoimentos.map((dep) => ({
      ...dep,
      avatarClienteUrl: getPublicUrl('avatars', dep.users?.avatar_path),
    }))
  ), [depoimentos, getPublicUrl]);

  const profissionaisView = useMemo(() => (
    profissionais.map((prof) => {
      const hojeDow = serverNow.date ? getDowFromDateSP(serverNow.date) : null;
      const totalEntregas = (entregasPorProf.get(prof.id) || []).length;
      const totalEntregasPaginadas = entregaPagesByProf?.[prof.id]?.totalCount;
      const horarioExibicao = getHorarioExibicao(prof);
      const statusKey = resolveProfissionalStatusKey(prof);
      return {
        ...prof,
        avatarUrl: getPublicUrl('avatars', prof.avatar_path),
        status: {
          label: getProfissionalStatusLabel(statusKey),
          color: getProfissionalStatusDotClass(statusKey),
        },
        depInfo: depoimentosPorProf.get(prof.id),
        profissaoLabel: String(prof?.profissao ?? '').trim(),
        almoco: getAlmocoRange(prof),
        horarioIni: String(horarioExibicao?.horario_inicio || '08:00').slice(0, 5),
        horarioFim: String(horarioExibicao?.horario_fim || '18:00').slice(0, 5),
        todayDow: hojeDow,
        totalEntregas: Number.isFinite(Number(totalEntregasPaginadas)) ? Number(totalEntregasPaginadas) : totalEntregas,
      };
    })
  ), [depoimentosPorProf, entregaPagesByProf, entregasPorProf, getAlmocoRange, getHorarioExibicao, getPublicUrl, getDowFromDateSP, profissionais, serverNow.date]);

  const entregaCards = useMemo(() => (
    profissionais.map((prof) => {
      const pageState = entregaPagesByProf?.[prof.id] || { pages: {}, totalCount: 0, loadingPage: null, version: 0 };
      const pages = Object.fromEntries(Object.entries(pageState.pages || {}).map(([page, rows]) => [
        page,
        (rows || []).map((entrega) => ({ ...entrega, preco_final: getPrecoFinalEntrega(entrega) })),
      ]));
      const lista = (entregasPorProf.get(prof.id) || []).map((entrega) => ({ ...entrega, preco_final: getPrecoFinalEntrega(entrega) }));
      return {
        id: prof.id,
        nome: prof.nome,
        profissional: prof,
        lista,
        pages,
        totalEntregas: Number(pageState.totalCount || 0),
        loadingPage: pageState.loadingPage,
        version: pageState.version || 0,
      };
    })
  ), [entregaPagesByProf, entregasPorProf, getPrecoFinalEntrega, profissionais]);

  const galeriaView = useMemo(() => (
    galeriaItems
      .map((item) => ({ ...item, url: getPublicUrl('galerias', item.path) }))
      .filter((item) => item.url)
  ), [galeriaItems, getPublicUrl]);

  const depoimentosNegocio = useMemo(() => depoimentos.filter((d) => d.tipo === 'negocio'), [depoimentos]);
  const mediaDepoimentos = depoimentosNegocio.length > 0 ? (depoimentosNegocio.reduce((sum, d) => sum + d.nota, 0) / depoimentosNegocio.length).toFixed(1) : '0.0';
  const temaAtivo = negocio?.tema || 'dark';
  const isLight = temaAtivo === 'light';

  const styles = {
    headerVoltar: isLight ? 'text-vsub hover:text-vtext' : 'text-vsub hover:text-primary',
    depoimentoBtn: isLight ? (isProfessional ? 'border-vborder2 text-vmuted cursor-not-allowed bg-vcard2' : 'border-vborder text-vsub hover:border-vprimary hover:text-vtext bg-vcard') : (isProfessional ? 'border-vborder2 text-vmuted cursor-not-allowed bg-vcard2' : 'border-vborder text-vsub hover:border-primary bg-vcard2'),
    favoritoBtn: isLight ? (isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : isFavorito ? 'bg-red-50 border-red-300 text-red-500' : 'bg-vcard border-vborder text-vsub hover:text-red-500 hover:border-red-300') : (isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : isFavorito ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-vcard2 border-vborder text-vsub hover:text-red-400'),
    socialIconCl: isLight ? 'border-vborder bg-vcard text-vsub hover:bg-vcard2 hover:border-vprimary/40 hover:text-vtext' : 'border-white/20 bg-white/7 text-white/80 hover:bg-white/15 hover:border-white/35',
    heroBg: isLight ? 'bg-[linear-gradient(135deg,var(--vcard)_0%,var(--vbg)_48%,var(--vcard2)_100%)]' : 'bg-gradient-to-br from-primary/20 via-vbg to-yellow-600/20',
    telClass: isLight ? 'text-vtext hover:text-vsub' : 'text-primary hover:text-yellow-500',
    addrClass: 'text-vsub',
    mediaColor: isLight ? 'text-vtext' : 'text-primary',
    depBtn: isLight ? (isProfessional ? 'bg-vcard2 border-vborder2 text-vmuted cursor-not-allowed' : 'bg-vcard2 hover:bg-vcard border-vborder text-vtext') : (isProfessional ? 'bg-vcard border-vborder2 text-vmuted cursor-not-allowed' : 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary'),
    depoModalBg: isLight ? 'bg-vcard border-vborder' : 'bg-dark-100 border-gray-800',
    depoModalTitle: isLight ? 'text-vtext' : 'text-white',
    depoModalClose: isLight ? 'text-vmuted hover:text-vtext' : 'text-gray-400 hover:text-white',
    depoModalLabel: isLight ? 'text-vsub' : 'text-gray-300',
    depoNegBtn: (t) => t === 'negocio' ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-blue-500/20 border-blue-500/50 text-blue-400') : (isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-400'),
    depoProfBtn: (t) => t === 'profissional' ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-primary/20 border-primary/50 text-primary') : (isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-400'),
    depoProfItem: (sel) => sel ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-primary/20 border-primary/50 text-primary') : (isLight ? 'bg-vcard2 border-vborder text-vsub hover:border-vprimary hover:text-vtext' : 'bg-dark-200 border-gray-800 text-gray-400 hover:border-primary/30'),
    depoNotaBtn: (n) => depoimentoNota >= n ? (isLight ? 'bg-vprimary border-vprimary text-vprimary-text' : 'bg-primary/20 border-primary/50 text-primary') : (isLight ? 'bg-vcard2 border-vborder text-vmuted' : 'bg-dark-200 border-gray-800 text-gray-500'),
    depoTextarea: isLight ? 'bg-vcard border-vborder text-vtext placeholder-vmuted focus:border-vprimary' : 'bg-dark-200 border-gray-800 text-white placeholder-gray-500 focus:border-primary',
    depoSendBtn: isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black',
    depoHintCl: isLight ? 'text-vmuted' : 'text-gray-500',
    confirmadoBg: isLight ? 'bg-vcard border-vborder' : 'bg-dark-100 border-gray-800',
    confirmadoTitle: isLight ? 'text-vtext' : 'text-white',
    confirmadoSub: isLight ? 'text-vsub' : 'text-gray-500',
    confirmadoHora: isLight ? 'text-vtext font-bold' : 'text-primary',
    confirmadoData: isLight ? 'text-vsub' : 'text-gray-400',
    confirmadoAgBtn: isLight ? 'bg-vprimary text-vprimary-text hover:opacity-90' : 'bg-gradient-to-r from-primary to-yellow-600 text-black',
  };

  return {
    logoUrl,
    instagramUrl,
    facebookUrl,
    depoimentosView,
    profissionaisView,
    entregaCards,
    galeriaView,
    mediaDepoimentos,
    temaAtivo,
    isLight,
    styles,
  };
}
