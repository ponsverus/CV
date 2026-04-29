import { useCallback, useEffect, useState } from 'react';
import {
  fetchDashboardDay,
  fetchDashboardFutureBookings,
  fetchDashboardPeriod,
  fetchDashboardToday,
  fetchDashboardTopCards,
  fetchDashboardUtilizacao,
} from '../api/dashboardApi';

export function useDashboardMetrics({
  negocioId,
  hoje,
  faturamentoData,
  faturamentoPeriodo,
  parceiroProfissionalId,
}) {
  const [metricsHoje, setMetricsHoje] = useState(null);
  const [metricsTopCards, setMetricsTopCards] = useState(null);
  const [metricsDia, setMetricsDia] = useState(null);
  const [metricsPeriodoData, setMetricsPeriodoData] = useState(null);
  const [metricsUtilizacao, setMetricsUtilizacao] = useState(null);
  const [metricsFutureBookings, setMetricsFutureBookings] = useState(null);
  const [metricsHojeLoading, setMetricsHojeLoading] = useState(false);
  const [metricsTopCardsLoading, setMetricsTopCardsLoading] = useState(false);
  const [metricsDiaLoading, setMetricsDiaLoading] = useState(false);
  const [metricsPeriodoLoading, setMetricsPeriodoLoading] = useState(false);
  const [metricsUtilizacaoLoading, setMetricsUtilizacaoLoading] = useState(false);
  const [metricsFutureBookingsLoading, setMetricsFutureBookingsLoading] = useState(false);

  const loadHoje = useCallback(async (id = negocioId, profId = parceiroProfissionalId) => {
    if (!id) return;
    try {
      setMetricsHojeLoading(true);
      setMetricsHoje(await fetchDashboardToday(id, profId));
    } catch {
      setMetricsHoje(null);
    } finally {
      setMetricsHojeLoading(false);
    }
  }, [negocioId, parceiroProfissionalId]);

  const loadTopCards = useCallback(async (id = negocioId, profId = parceiroProfissionalId, options = {}) => {
    if (!id) return;
    const silent = !!options?.silent;
    try {
      if (!silent) setMetricsTopCardsLoading(true);
      setMetricsTopCards(await fetchDashboardTopCards(id, profId));
    } catch {
      setMetricsTopCards(null);
    } finally {
      if (!silent) setMetricsTopCardsLoading(false);
    }
  }, [negocioId, parceiroProfissionalId]);

  const loadDia = useCallback(async (id = negocioId, dateISO = faturamentoData || hoje, profId = parceiroProfissionalId) => {
    if (!id || !dateISO) return;
    try {
      setMetricsDiaLoading(true);
      setMetricsDia(await fetchDashboardDay(id, String(dateISO), profId));
    } catch {
      setMetricsDia(null);
    } finally {
      setMetricsDiaLoading(false);
    }
  }, [faturamentoData, hoje, negocioId, parceiroProfissionalId]);

  const loadPeriodo = useCallback(async (id = negocioId, refDateISO = hoje, periodo = faturamentoPeriodo, profId = parceiroProfissionalId) => {
    if (!id || !refDateISO) return;
    try {
      setMetricsPeriodoLoading(true);
      setMetricsPeriodoData(await fetchDashboardPeriod(id, String(refDateISO), String(periodo || '7d'), profId));
    } catch {
      setMetricsPeriodoData(null);
    } finally {
      setMetricsPeriodoLoading(false);
    }
  }, [faturamentoPeriodo, hoje, negocioId, parceiroProfissionalId]);

  const loadUtilizacao = useCallback(async (id = negocioId, refDateISO = hoje, profId = parceiroProfissionalId) => {
    if (!id || !refDateISO) return;
    try {
      setMetricsUtilizacaoLoading(true);
      setMetricsUtilizacao(await fetchDashboardUtilizacao(id, String(refDateISO), profId));
    } catch {
      setMetricsUtilizacao(null);
    } finally {
      setMetricsUtilizacaoLoading(false);
    }
  }, [hoje, negocioId, parceiroProfissionalId]);

  const loadFutureBookings = useCallback(async (id = negocioId, refDateISO = hoje, profId = parceiroProfissionalId) => {
    if (!id || !refDateISO) return;
    try {
      setMetricsFutureBookingsLoading(true);
      setMetricsFutureBookings(await fetchDashboardFutureBookings(id, String(refDateISO), profId));
    } catch {
      setMetricsFutureBookings(null);
    } finally {
      setMetricsFutureBookingsLoading(false);
    }
  }, [hoje, negocioId, parceiroProfissionalId]);

  useEffect(() => {
    if (!negocioId || !hoje) return;
    loadHoje(negocioId, parceiroProfissionalId);
  }, [negocioId, hoje, parceiroProfissionalId, loadHoje]);

  useEffect(() => {
    if (!negocioId || !hoje) return;
    loadTopCards(negocioId, parceiroProfissionalId);
  }, [negocioId, hoje, parceiroProfissionalId, loadTopCards]);

  useEffect(() => {
    if (!negocioId || !faturamentoData) return;
    loadDia(negocioId, faturamentoData, parceiroProfissionalId);
  }, [negocioId, faturamentoData, parceiroProfissionalId, loadDia]);

  useEffect(() => {
    if (!negocioId || !hoje) return;
    loadPeriodo(negocioId, hoje, faturamentoPeriodo, parceiroProfissionalId);
  }, [negocioId, hoje, faturamentoPeriodo, parceiroProfissionalId, loadPeriodo]);

  useEffect(() => {
    if (!negocioId || !hoje) return;
    loadUtilizacao(negocioId, hoje, parceiroProfissionalId);
  }, [negocioId, hoje, parceiroProfissionalId, loadUtilizacao]);

  useEffect(() => {
    if (!negocioId || !hoje) return;
    loadFutureBookings(negocioId, hoje, parceiroProfissionalId);
  }, [negocioId, hoje, parceiroProfissionalId, loadFutureBookings]);

  return {
    metricsHoje,
    metricsTopCards,
    metricsDia,
    metricsPeriodoData,
    metricsUtilizacao,
    metricsFutureBookings,
    metricsHojeLoading,
    metricsTopCardsLoading,
    metricsDiaLoading,
    metricsPeriodoLoading,
    metricsUtilizacaoLoading,
    metricsFutureBookingsLoading,
    loadHoje,
    loadTopCards,
    loadDia,
    loadPeriodo,
    loadUtilizacao,
    loadFutureBookings,
  };
}
