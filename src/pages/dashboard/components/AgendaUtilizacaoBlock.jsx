import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function formatDurationFromMinutes(value) {
  const totalMinutes = Math.max(Number(value || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDateDots(value) {
  if (!value) return 'Selecionar';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return String(value);
  return `${day}.${month}.${year}`;
}

function MetricCard({ label, value, tone = 'text-white', subtle }) {
  return (
    <div className="bg-dark-200 border border-gray-800 rounded-custom p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-normal ${tone}`}>{value}</div>
      {subtle ? <div className="text-xs text-gray-500 mt-1">{subtle}</div> : null}
    </div>
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function ProfessionalMetricBar({ label, value, percent, barClass = 'bg-white' }) {
  const width = clampPercent(percent);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide leading-none">{label}</span>
        <span className="text-xs font-normal text-gray-200">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AgendaUtilizacaoBlock({
  souDono,
  metricsUtilizacao,
  metricsUtilizacaoLoading,
}) {
  const data = metricsUtilizacao?.utilizacao || {};
  const porProfissional = useMemo(
    () => (Array.isArray(data?.por_profissional) ? data.por_profissional : []),
    [data?.por_profissional]
  );
  const [cardsPerPage, setCardsPerPage] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const updateCardsPerPage = () => {
      setCardsPerPage(window.innerWidth < 768 ? 1 : 3);
    };

    updateCardsPerPage();
    window.addEventListener('resize', updateCardsPerPage);
    return () => window.removeEventListener('resize', updateCardsPerPage);
  }, []);

  const pageCount = Math.max(1, Math.ceil(porProfissional.length / cardsPerPage));
  const currentPage = Math.min(page, pageCount - 1);

  useEffect(() => {
    setPage((prev) => Math.min(prev, pageCount - 1));
  }, [pageCount]);

  const visibleProfissionais = useMemo(() => {
    const start = currentPage * cardsPerPage;
    return porProfissional.slice(start, start + cardsPerPage);
  }, [cardsPerPage, currentPage, porProfissional]);

  return (
    <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-normal uppercase">Utiliza. da Agenda</h3>
        </div>
        <div className="inline-flex items-center self-start rounded-full border border-gray-700 bg-dark-100 px-3 py-1 text-xs text-gray-300">
          {formatDateDots(data?.amanha)}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        <MetricCard
          label="TAXA DE OCUPA."
          tone="text-primary"
          value={metricsUtilizacaoLoading ? '...' : formatPercent(data?.taxa_ocupacao)}
        />
        <MetricCard
          label="TEMPO OCUPADO"
          tone="text-green-400"
          value={metricsUtilizacaoLoading ? '...' : formatDurationFromMinutes(data?.minutos_ocupados)}
        />
        <MetricCard
          label="TEMPO TOTAL"
          value={metricsUtilizacaoLoading ? '...' : formatDurationFromMinutes(data?.minutos_disponiveis)}
        />
        <MetricCard
          label="TEMPO DISPONÍVEL"
          tone="text-yellow-400"
          value={metricsUtilizacaoLoading ? '...' : formatDurationFromMinutes(data?.minutos_ociosos)}
        />
        <MetricCard
          label="AGENDAMENTOS"
          value={metricsUtilizacaoLoading ? '...' : Number(data?.agendamentos_validos || 0)}
          subtle={metricsUtilizacaoLoading ? null : `${Number(data?.cancelados || 0)} cancelado(s)`}
        />
      </div>

      {souDono && porProfissional.length > 0 ? (
        <div className="mt-4 relative md:px-12">
          {pageCount > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className="hidden md:inline-flex absolute left-1 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-dark-100 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
                disabled={currentPage === pageCount - 1}
                className="hidden md:inline-flex absolute right-1 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-dark-100 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : null}

          <div className="grid md:grid-cols-3 gap-3 items-start">
            {visibleProfissionais.map((item) => (
              <div key={String(item?.profissional_id || item?.nome)} className="bg-dark-100 border border-gray-800 rounded-custom p-4">
                {(() => {
                  const validos = Number(item?.agendamentos_validos || 0);
                  const cancelados = Number(item?.cancelados || 0);
                  const totalAgendamentos = Math.max(validos + cancelados, 1);
                  const minutosDisponiveis = Number(item?.minutos_disponiveis || 0);
                  const minutosOcupados = Number(item?.minutos_ocupados || 0);
                  const minutosOciosos = Number(item?.minutos_ociosos || 0);

                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Profissional</div>
                    <div className="mt-1 font-normal text-white leading-snug">{String(item?.nome || 'PROFISSIONAL')}</div>
                  </div>
                  <div className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-normal text-primary">
                    {formatPercent(item?.taxa_ocupacao)}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <ProfessionalMetricBar label="Válidos" value={validos} percent={(validos / totalAgendamentos) * 100} barClass="bg-white" />
                  <ProfessionalMetricBar label="Cancelados" value={cancelados} percent={(cancelados / totalAgendamentos) * 100} barClass="bg-red-400" />
                  <ProfessionalMetricBar label="Disponível" value={formatDurationFromMinutes(minutosOciosos)} percent={minutosDisponiveis > 0 ? (minutosOciosos / minutosDisponiveis) * 100 : 0} barClass="bg-yellow-400" />
                  <ProfessionalMetricBar label="Ocupado" value={formatDurationFromMinutes(minutosOcupados)} percent={minutosDisponiveis > 0 ? (minutosOcupados / minutosDisponiveis) * 100 : 0} barClass="bg-green-400" />
                  <ProfessionalMetricBar label="Tempo total" value={formatDurationFromMinutes(minutosDisponiveis)} percent={minutosDisponiveis > 0 ? 100 : 0} barClass="bg-gray-300" />
                  <ProfessionalMetricBar label="Ocupação" value={formatPercent(item?.taxa_ocupacao)} percent={item?.taxa_ocupacao} barClass="bg-primary" />
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between md:justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-full border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: pageCount }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPage(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentPage ? 'bg-primary' : 'bg-gray-600 hover:bg-gray-400'}`}
                    aria-label={`Ir para página ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
                disabled={currentPage === pageCount - 1}
                className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-full border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
