import { useCallback, useEffect, useState } from 'react';
import { AG_PAGE_SIZE } from '../utils';
import { fetchAgendamentosNegocio, fetchHistoricoProfissionalIds } from '../api/dashboardApi';

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
  const [historicoProfIds, setHistoricoProfIds] = useState([]);

  useEffect(() => {
    setHistoricoData((prev) => (prev ? prev : hoje));
  }, [hoje]);

  useEffect(() => {
    let active = true;
    if (!negocioId) {
      setHistoricoProfIds([]);
      return () => {
        active = false;
      };
    }

    if (parceiroProfissionalId) {
      setHistoricoProfIds([parceiroProfissionalId]);
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const ids = await fetchHistoricoProfissionalIds(negocioId);
        if (active) setHistoricoProfIds(ids);
      } catch {
        if (active) setHistoricoProfIds([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [negocioId, parceiroProfissionalId]);

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
    if (!historicoProfIds?.length || !historicoData || !negocioId) return;
    setHistoricoPage(0);
    setHistoricoHasMore(false);
    setHistoricoAgendamentos([]);
    fetchHistoricoPage({ profIds: historicoProfIds, date: historicoData, page: 0, append: false });
  }, [fetchHistoricoPage, historicoData, historicoProfIds, negocioId]);

  const loadMoreHistorico = useCallback(async () => {
    if (historicoLoadingMore || !historicoHasMore || !negocioId || !historicoProfIds?.length) return;
    try {
      setHistoricoLoadingMore(true);
      const nextPage = historicoPage + 1;
      await fetchHistoricoPage({ profIds: historicoProfIds, date: historicoData, page: nextPage, append: true });
      setHistoricoPage(nextPage);
    } catch {
      // Mantem o estado atual se a pagina adicional do historico falhar.
    } finally {
      setHistoricoLoadingMore(false);
    }
  }, [
    fetchHistoricoPage,
    historicoData,
    historicoHasMore,
    historicoLoadingMore,
    historicoPage,
    historicoProfIds,
    negocioId,
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
