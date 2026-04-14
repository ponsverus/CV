import { useCallback, useEffect, useState } from 'react';
import { fetchClientesDashboard } from '../api/dashboardApi';

const CLIENTES_PAGE_SIZE = 50;

export function useDashboardClientes({ negocioId }) {
  const [clientes, setClientes] = useState([]);
  const [clientesPage, setClientesPage] = useState(0);
  const [clientesHasMore, setClientesHasMore] = useState(false);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesLoadingMore, setClientesLoadingMore] = useState(false);
  const [clientesError, setClientesError] = useState('');

  const loadClientes = useCallback(async ({ page = 0, append = false } = {}) => {
    if (!negocioId) return;
    const rows = await fetchClientesDashboard({
      negocioId,
      limit: CLIENTES_PAGE_SIZE,
      offset: page * CLIENTES_PAGE_SIZE,
    });

    setClientes((prev) => {
      const next = append ? [...prev, ...rows] : rows;
      const seen = new Set();
      return next.filter((item) => {
        if (!item?.cliente_id || seen.has(item.cliente_id)) return false;
        seen.add(item.cliente_id);
        return true;
      });
    });
    setClientesHasMore(rows.length === CLIENTES_PAGE_SIZE);
  }, [negocioId]);

  useEffect(() => {
    if (!negocioId) {
      setClientes([]);
      setClientesPage(0);
      setClientesHasMore(false);
      return;
    }

    let active = true;
    setClientesLoading(true);
    setClientesError('');
    setClientesPage(0);
    setClientesHasMore(false);

    loadClientes({ page: 0, append: false })
      .catch((error) => {
        if (!active) return;
        setClientes([]);
        setClientesError(error?.message || 'Erro ao carregar clientes.');
      })
      .finally(() => {
        if (active) setClientesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadClientes, negocioId]);

  const loadMoreClientes = useCallback(async () => {
    if (clientesLoadingMore || !clientesHasMore || !negocioId) return;
    try {
      setClientesLoadingMore(true);
      const nextPage = clientesPage + 1;
      await loadClientes({ page: nextPage, append: true });
      setClientesPage(nextPage);
    } catch (error) {
      setClientesError(error?.message || 'Erro ao carregar mais clientes.');
    } finally {
      setClientesLoadingMore(false);
    }
  }, [clientesHasMore, clientesLoadingMore, clientesPage, loadClientes, negocioId]);

  return {
    clientes,
    clientesLoading,
    clientesError,
    clientesHasMore,
    clientesLoadingMore,
    loadMoreClientes,
  };
}
