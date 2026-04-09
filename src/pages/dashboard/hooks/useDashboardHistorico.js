import { useCallback, useEffect, useState } from 'react';
import { AG_PAGE_SIZE } from '../utils';
import { fetchAgendamentosNegocio } from '../api/dashboardApi';

export function useDashboardHistorico({
  negocioId,
  hoje,
  agProfIds,
  parceiroProfissionalId,
  parceiroProfissional,
}) {
  const [historicoAgendamentos, setHistoricoAgendamentos] = useState([]);
  const [historicoPage, setHistoricoPage] = useState(0);
  const [historicoHasMore, setHistoricoHasMore] = useState(false);
  const [historicoLoadingMore, setHistoricoLoadingMore] = useState(false);
  const [historicoData, setHistoricoData] = useState('');

  useEffect(() => {
    setHistoricoData((prev) => (prev ? prev : hoje));
  }, [hoje]);

  const fetchHistoricoPage = useCallback(async ({ profIds, date, page, append }) => {
    const rows = await fetchAgendamentosNegocio({
      negocioId,
      profissionalIds: profIds,
      dataInicio: date,
      dataFim: date,
      limit: AG_PAGE_SIZE,
      offset: page * AG_PAGE_SIZE,
    });

    setHistoricoAgendamentos((prev) => {
      const next = append ? [...prev, ...rows] : rows;
      const seen = new Set();
      return next.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
    });
    setHistoricoHasMore(rows.length === AG_PAGE_SIZE);
  }, [negocioId]);

  useEffect(() => {
    if (!agProfIds?.length || !historicoData || !negocioId) return;
    const ids = parceiroProfissionalId ? [parceiroProfissionalId] : agProfIds;
    setHistoricoPage(0);
    setHistoricoHasMore(false);
    setHistoricoAgendamentos([]);
    fetchHistoricoPage({ profIds: ids, date: historicoData, page: 0, append: false });
  }, [agProfIds, fetchHistoricoPage, historicoData, negocioId, parceiroProfissionalId]);

  const loadMoreHistorico = useCallback(async () => {
    if (historicoLoadingMore || !historicoHasMore || !negocioId || !agProfIds?.length) return;
    const ids = parceiroProfissional ? [parceiroProfissional.id] : agProfIds;
    try {
      setHistoricoLoadingMore(true);
      const nextPage = historicoPage + 1;
      await fetchHistoricoPage({ profIds: ids, date: historicoData, page: nextPage, append: true });
      setHistoricoPage(nextPage);
    } catch {
      // Mantem o estado atual se a pagina adicional do historico falhar.
    } finally {
      setHistoricoLoadingMore(false);
    }
  }, [
    agProfIds,
    fetchHistoricoPage,
    historicoData,
    historicoHasMore,
    historicoLoadingMore,
    historicoPage,
    negocioId,
    parceiroProfissional,
  ]);

  return {
    historicoAgendamentos,
    historicoHasMore,
    historicoLoadingMore,
    historicoData,
    setHistoricoData,
    loadMoreHistorico,
  };
}
