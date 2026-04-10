import { useCallback, useMemo } from 'react';

export function useVitrinePresentation({
  negocio,
  profissionais,
  entregas,
  depoimentos,
  galeriaItems,
  isProfessional,
  isFavorito,
  depoimentoNota,
  serverNow,
  getPublicUrl,
  getPrecoFinalServico,
  getDowFromDateSP,
  normalizeDiasTrabalho,
  resolveInstagram,
  resolveFacebook,
  timeToMinutes,
}) {
  const logoUrl = useMemo(() => getPublicUrl('logos', negocio?.logo_path), [getPublicUrl, negocio?.logo_path]);
  const instagramUrl = useMemo(() => resolveInstagram(negocio?.instagram), [negocio?.instagram, resolveInstagram]);
  const facebookUrl = useMemo(() => resolveFacebook(negocio?.facebook), [negocio?.facebook, resolveFacebook]);

  const getAlmocoRange = useCallback((p) => ({ ini: p?.almoco_inicio || null, fim: p?.almoco_fim || null }), []);

  const isInLunchNow = useCallback((p) => {
    const { ini, fim } = getAlmocoRange(p);
    if (!ini || !fim) return false;
    const a = timeToMinutes(ini);
    const b = timeToMinutes(fim);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (b < a) return (serverNow.minutes >= a || serverNow.minutes < b);
    return (serverNow.minutes >= a && serverNow.minutes < b);
  }, [getAlmocoRange, serverNow.minutes, timeToMinutes]);

  const getProfStatus = useCallback((p) => {
    if (p?.status !== 'ativo') return { label: 'FECHADO', color: 'bg-red-500' };
    if (!serverNow.date) return null;
    const ini = timeToMinutes(p?.horario_inicio || '08:00');
    const fim = timeToMinutes(p?.horario_fim || '18:00');
    const dias = normalizeDiasTrabalho(p?.dias_trabalho);
    const diasEfetivos = dias.length ? dias : [0, 1, 2, 3, 4, 5, 6];
    const hojeDow = getDowFromDateSP(serverNow.date);
    const trabalhaHoje = hojeDow == null ? true : diasEfetivos.includes(hojeDow);
    const dentroHorario = serverNow.minutes >= ini && serverNow.minutes < fim;
    if (!(trabalhaHoje && dentroHorario)) return { label: 'FECHADO', color: 'bg-red-500' };
    if (isInLunchNow(p)) return { label: 'PAUSA', color: 'bg-yellow-400' };
    return { label: 'ABERTO', color: 'bg-green-500' };
  }, [getDowFromDateSP, isInLunchNow, normalizeDiasTrabalho, serverNow.date, serverNow.minutes, timeToMinutes]);

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
      const totalEntregas = (entregasPorProf.get(prof.id) || []).length;
      return {
        ...prof,
        avatarUrl: getPublicUrl('avatars', prof.avatar_path),
        status: getProfStatus(prof),
        depInfo: depoimentosPorProf.get(prof.id),
        profissaoLabel: String(prof?.profissao ?? '').trim(),
        almoco: getAlmocoRange(prof),
        horarioIni: String(prof.horario_inicio || '08:00').slice(0, 5),
        horarioFim: String(prof.horario_fim || '18:00').slice(0, 5),
        totalEntregas,
      };
    })
  ), [depoimentosPorProf, entregasPorProf, getAlmocoRange, getProfStatus, getPublicUrl, profissionais]);

  const entregaCards = useMemo(() => (
    profissionais.map((prof) => {
      const lista = (entregasPorProf.get(prof.id) || []).slice().sort((a, b) => {
        const pa = Number(getPrecoFinalServico(a) ?? 0);
        const pb = Number(getPrecoFinalServico(b) ?? 0);
        if (pb !== pa) return pb - pa;
        return String(a.nome || '').localeCompare(String(b.nome || ''));
      }).map((entrega) => ({ ...entrega, preco_final: getPrecoFinalServico(entrega) }));
      return { id: prof.id, nome: prof.nome, profissional: prof, lista };
    })
  ), [entregasPorProf, getPrecoFinalServico, profissionais]);

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
    profissaoTag: isLight ? 'bg-black border-black text-white' : 'bg-primary/20 border-primary/30 text-primary',
    almocoBadge: isLight ? 'text-amber-700' : 'text-yellow-400',
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
