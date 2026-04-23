import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useVitrineBooking({
  user,
  userType,
  todayISO,
  fetchNowFromDb,
  confirmKey,
  alertKey,
  navigate,
  location,
  loading,
  negocio,
  nomeNegocioLabel,
  profissionais,
  entregas,
  counterPlural,
  getPrecoFinalServico,
  gerarLinkGoogle,
  gerarArquivoICS,
  calendarPlatformMode,
}) {
  const [calendarExport, setCalendarExport] = useState({ googleUrl: '', icsUrl: '', icsFilename: '' });
  const [flow, setFlow] = useState({ step: 'idle', profissional: null, servicosSelecionados: [], lastSlot: null });
  const [selecaoProfId, setSelecaoProfId] = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const rebookAppliedRef = useRef('');
  const assistedBooking = location.state?.assistedBooking || null;
  const isAssistedBooking = !!(user && userType === 'professional' && assistedBooking?.clienteId);

  const revokeCurrentIcs = useCallback(() => {
    setCalendarExport((prev) => {
      if (prev.icsUrl) URL.revokeObjectURL(prev.icsUrl);
      return { googleUrl: '', icsUrl: '', icsFilename: '' };
    });
  }, []);

  useEffect(() => {
    return () => {
      if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    };
  }, [calendarExport.icsUrl]);

  useEffect(() => {
    const rebook = location.state?.rebook;
    if (!rebook || loading || !negocio?.id) return;
    const rebookKey = `${location.key || location.pathname}:${rebook.profissionalId || ''}:${rebook.entregaId || ''}`;
    if (rebookAppliedRef.current === rebookKey) return;
    const profissional = profissionais.find((item) => item.id === rebook.profissionalId);
    const servico = entregas.find((item) =>
      item.id === rebook.entregaId &&
      item.profissional_id === rebook.profissionalId &&
      item.ativo !== false
    );
    if (!profissional || !servico) return;
    rebookAppliedRef.current = rebookKey;
    setSelecaoProfId(null);
    setServicosSelecionados([]);
    revokeCurrentIcs();
    setFlow({ step: 'booking', profissional, servicosSelecionados: [servico], lastSlot: null });
    navigate(location.pathname, { replace: true, state: {} });
  }, [entregas, loading, location.key, location.pathname, location.state, navigate, negocio?.id, profissionais, revokeCurrentIcs]);

  const requireLogin = useCallback(async () => {
    if (!user) {
      const ok = await confirmKey(
        'schedule_need_login_confirm',
        'Login necessário',
        'Você precisa fazer login para agendar. Deseja fazer login agora?',
        'IR PARA LOGIN',
        'MAIS TARDE'
      );
      if (ok) navigate('/login');
      return false;
    }
    if (userType !== 'client' && !isAssistedBooking) {
      alertKey(
        'schedule_only_client',
        'Uso restrita',
        'Você está logado como PROFISSIONAL. Para agendar, entre como CLIENTE.',
        'ENTENDI'
      );
      return false;
    }
    if (!todayISO) {
      try {
        await fetchNowFromDb();
      } catch {
        alertKey(
          'schedule_time_unavailable',
          'Horário oficial indisponível',
          'Ainda estamos sincronizando o horário oficial. Tente novamente em instantes.',
          'ENTENDI'
        );
        return false;
      }
    }
    return true;
  }, [alertKey, confirmKey, fetchNowFromDb, isAssistedBooking, navigate, todayISO, user, userType]);

  const handleAgendarAgora = useCallback(async (profissional, servicos) => {
    if (!(await requireLogin())) return;
    setSelecaoProfId(null);
    setServicosSelecionados([]);
    revokeCurrentIcs();
    setFlow({ step: 'booking', profissional, servicosSelecionados: servicos, lastSlot: null });
  }, [requireLogin, revokeCurrentIcs]);

  const handleToggleSelecao = useCallback(async (profissional, servico) => {
    if (!(await requireLogin())) return;
    setServicosSelecionados((prev) => {
      const jaTemEsseProf = selecaoProfId && selecaoProfId !== profissional.id;
      if (jaTemEsseProf) return prev;
      const existe = prev.some((item) => item.id === servico.id);
      const proximo = existe ? prev.filter((item) => item.id !== servico.id) : [...prev, servico];
      if (proximo.length === 0) setSelecaoProfId(null);
      else setSelecaoProfId(profissional.id);
      return proximo;
    });
  }, [requireLogin, selecaoProfId]);

  const handleConfirmarSelecao = useCallback(() => {
    if (!servicosSelecionados.length) return;
    const profissional = profissionais.find((item) => item.id === selecaoProfId);
    if (!profissional) return;
    revokeCurrentIcs();
    setFlow({ step: 'booking', profissional, servicosSelecionados, lastSlot: null });
    setSelecaoProfId(null);
    setServicosSelecionados([]);
  }, [profissionais, revokeCurrentIcs, selecaoProfId, servicosSelecionados]);

  const handleLimparSelecao = useCallback(() => {
    setSelecaoProfId(null);
    setServicosSelecionados([]);
  }, []);

  const entregaVirtual = useMemo(() => {
    if (!flow.servicosSelecionados?.length) return null;
    const primeiroServico = flow.servicosSelecionados[0];
    const durTotal = flow.servicosSelecionados.reduce((sum, item) => sum + Number(item?.duracao_minutos || 0), 0);
    const valTotal = flow.servicosSelecionados.reduce((sum, item) => sum + getPrecoFinalServico(item), 0);
    return {
      id: primeiroServico.id,
      nome: flow.servicosSelecionados.length === 1 ? primeiroServico.nome : `${flow.servicosSelecionados.length} ${counterPlural}`,
      duracao_minutos: durTotal,
      preco: valTotal,
      preco_promocional: null,
      entrega_ids: flow.servicosSelecionados.map((item) => item.id).filter(Boolean),
    };
  }, [counterPlural, flow.servicosSelecionados, getPrecoFinalServico]);

  const handleBookingConfirm = useCallback((slot) => {
    const primeiroServico = flow.servicosSelecionados?.[0];
    const durTotal = (flow.servicosSelecionados || []).reduce((sum, item) => sum + Number(item?.duracao_minutos || 0), 0);
    const serviceNames = (flow.servicosSelecionados || []).map((item) => item?.nome).filter(Boolean);
    const titulo = primeiroServico?.nome || 'Agendamento';
    const detalhes = [
      'Agendamento confirmado pelo Comvaga.',
      flow.profissional?.nome ? `Profissional: ${flow.profissional.nome}` : '',
      serviceNames.length ? `Serviços: ${serviceNames.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const local = negocio?.endereco || nomeNegocioLabel || '';
    const googleUrl = gerarLinkGoogle({
      titulo,
      dataISO: slot.dataISO,
      inicioHHMM: slot.inicio,
      fimHHMM: slot.fim,
      duracaoMin: durTotal,
      detalhes,
      local,
    });
    const icsFile = gerarArquivoICS({
      titulo,
      dataISO: slot.dataISO,
      inicioHHMM: slot.inicio,
      fimHHMM: slot.fim,
      duracaoMin: durTotal,
      detalhes,
      local,
      uidSeed: `${negocio?.id || 'negocio'}-${flow.profissional?.id || 'profissional'}-${slot.dataISO}-${slot.inicio}`,
    });
    const icsBlob = new Blob([icsFile.content], { type: 'text/calendar;charset=utf-8' });
    if (calendarExport.icsUrl) URL.revokeObjectURL(calendarExport.icsUrl);
    const icsUrl = URL.createObjectURL(icsBlob);
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.sendTags({
          ultima_acao: 'agendamento_realizado',
          servico_nome: primeiroServico?.nome || 'Servico',
          data_agendamento: slot.dataISO,
          horario_agendamento: slot.label,
        });
      });
    }
    setCalendarExport({ googleUrl, icsUrl, icsFilename: icsFile.filename });
    setFlow((prev) => ({ ...prev, step: 'confirmado', lastSlot: slot }));
  }, [calendarExport.icsUrl, flow.profissional?.id, flow.profissional?.nome, flow.servicosSelecionados, gerarArquivoICS, gerarLinkGoogle, negocio?.endereco, negocio?.id, nomeNegocioLabel]);

  const abrirGoogleAgenda = useCallback(() => {
    if (!calendarExport.googleUrl) return;
    window.open(calendarExport.googleUrl, '_blank', 'noopener,noreferrer');
  }, [calendarExport.googleUrl]);

  const baixarEventoICS = useCallback(() => {
    if (!calendarExport.icsUrl) return;
    const link = document.createElement('a');
    link.href = calendarExport.icsUrl;
    link.download = calendarExport.icsFilename || 'evento.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [calendarExport.icsFilename, calendarExport.icsUrl]);

  const calendarActionConfig = useMemo(() => {
    if (calendarPlatformMode === 'google-with-fallback') {
      return {
        primaryLabel: 'ABRIR NO GOOGLE AGENDA',
        primaryAction: abrirGoogleAgenda,
        secondaryLabel: 'BAIXAR AGENDAMENTO',
        secondaryAction: baixarEventoICS,
      };
    }
    if (calendarPlatformMode === 'ics') {
      return {
        hint: 'Baixar evento compatível com Calendário do iPhone, Mac e Outlook.',
        primaryLabel: 'BAIXAR EVENTO DO CALENDÁRIO',
        primaryAction: baixarEventoICS,
        secondaryLabel: '',
        secondaryAction: null,
      };
    }
    return {
      hint: 'Baixar evento compatível com os principais aplicativos de calendário.',
      primaryLabel: 'BAIXAR EVENTO DO CALENDÁRIO',
      primaryAction: baixarEventoICS,
      secondaryLabel: '',
      secondaryAction: null,
    };
  }, [abrirGoogleAgenda, baixarEventoICS, calendarPlatformMode]);

  return {
    flow,
    hasSelecao: servicosSelecionados.length > 0,
    servicosSelecionados,
    entregaVirtual,
    calendarActionConfig,
    handleAgendarAgora,
    handleToggleSelecao,
    handleConfirmarSelecao,
    handleLimparSelecao,
    handleBookingConfirm,
    closeBooking: () => setFlow((prev) => ({ ...prev, step: 'idle' })),
    bookingSectionState: {
      selecaoProfId,
      servicosSelecionados,
      onAgendarAgora: handleAgendarAgora,
      onToggleSelecao: handleToggleSelecao,
      isAssistedBooking,
      assistedClienteId: assistedBooking?.clienteId || null,
      assistedClienteNome: assistedBooking?.clienteNome || '',
      assistedReturnTo: assistedBooking?.returnTo || '/dashboard',
    },
  };
}
