import React from 'react';
import DatePicker from '../../../components/DatePicker';
import PeriodoSelect from '../../../components/PeriodoSelect';
import AgendaUtilizacaoBlock from '../components/AgendaUtilizacaoBlock';
import FutureBookingsBlock from '../components/FutureBookingsBlock';
import { getAgInicio } from '../utils';

export default function VisaoGeralSection({
  metricsHoje,
  proximoAgendamento,
  souDono,
  faturamentoPorProfissionalHoje,
  faturamentoData,
  setFaturamentoData,
  hoje,
  metricsDiaLoading,
  metricsDia,
  faturamentoPorProfissionalFiltro,
  faturamentoPeriodo,
  setFaturamentoPeriodo,
  metricsPeriodoData,
  metricsPeriodoLoading,
  metricsUtilizacao,
  metricsUtilizacaoLoading,
  metricsFutureBookings,
  metricsFutureBookingsLoading,
  counterSingular,
}) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4 items-start">
        <div className="relative bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-2">CANCELAMENTOS HOJE</div><div className="absolute right-4 top-4 inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-400">{Number(metricsHoje?.today?.taxa_cancelamento || 0).toFixed(1)}%</div><div className="text-3xl font-normal text-white">{Number(metricsHoje?.today?.cancelados || 0)}</div></div>
        <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-2">CONCLUÍDOS HOJE</div><div className="text-3xl font-normal text-white">{Number(metricsHoje?.today?.concluidos || 0)}</div><div className="mt-2 inline-flex items-center rounded-full border border-gray-700 bg-transparent px-3 py-1 text-xs"><span className="text-gray-500">TICKET MÉDIO</span><span className="ml-1.5 text-primary">R$ {Number(metricsHoje?.today?.ticket_medio || 0).toFixed(2)}</span></div></div>
        <div className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-2">PRÓXIMO AGENDAMENTO</div>{proximoAgendamento ? (<><div className="text-3xl font-normal text-primary">{getAgInicio(proximoAgendamento)}</div><div className="text-sm text-gray-300 mt-1">{proximoAgendamento.cliente?.nome || '—'} • {proximoAgendamento.profissionais?.nome}</div><div className="text-xs text-gray-500 mt-1">{proximoAgendamento.entregas?.nome}</div></>) : <div className="text-sm text-gray-500">:(</div>}</div>
      </div>
      {souDono && faturamentoPorProfissionalHoje.length > 0 && (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">{faturamentoPorProfissionalHoje.map(([nome, valor]) => (<div key={String(nome)} className="bg-dark-200 border border-gray-800 rounded-custom p-5"><div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div><div className="font-normal text-white">{String(nome || '—')}</div><div className="text-primary font-normal mt-1">R$ {Number(valor || 0).toFixed(2)}</div></div>))}</div>)}
      <AgendaUtilizacaoBlock
        souDono={souDono}
        metricsUtilizacao={metricsUtilizacao}
        metricsUtilizacaoLoading={metricsUtilizacaoLoading}
      />
      <FutureBookingsBlock
        souDono={souDono}
        metricsFutureBookings={metricsFutureBookings}
        metricsFutureBookingsLoading={metricsFutureBookingsLoading}
      />
      <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"><h3 className="text-lg font-normal flex items-center gap-2 uppercase"><span style={{ fontFamily: 'Roboto Condensed, sans-serif' }} className="font-normal text-2xl">$</span>FATURAMENTO</h3><DatePicker value={faturamentoData} onChange={(iso) => setFaturamentoData(iso)} todayISO={hoje} /></div>
        <div className="text-3xl font-normal text-white mb-2">{metricsDiaLoading ? <span className="text-gray-500 text-xl">...</span> : <>R$ {Number(metricsDia?.selected_day?.faturamento || 0).toFixed(2)}</>}</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 items-start">
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">CONCLUÍDOS</div><div className="text-xl font-normal text-green-400">{Number(metricsDia?.selected_day?.concluidos || 0)}</div></div>
          <div className="relative bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">CANCELADOS</div><div className="absolute right-3 top-3 inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs text-red-400">{Number(metricsDia?.selected_day?.taxa_cancelamento || 0).toFixed(1)}%</div><div className="text-xl font-normal text-red-400">{Number(metricsDia?.selected_day?.cancelados || 0)}</div></div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">FECHAMENTO</div><div className="text-xl font-normal text-white">{Number(metricsDia?.selected_day?.taxa_conversao || 0).toFixed(1)}%</div><div className="mt-2 inline-flex items-center rounded-full border border-gray-700 bg-transparent px-3 py-1 text-sm text-gray-500">sobre {Number(metricsDia?.selected_day?.total || 0)} agendamento(s)</div></div>
          <div className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">TICKET MÉDIO</div><div className="text-xl font-normal text-primary">R$ {Number(metricsDia?.selected_day?.ticket_medio || 0).toFixed(2)}</div></div>
        </div>
        {souDono && faturamentoPorProfissionalFiltro.length > 0 && (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 items-start">{faturamentoPorProfissionalFiltro.map(([nome, valor]) => (<div key={String(nome)} className="bg-dark-100 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div><div className="font-normal text-white">{String(nome || '—')}</div><div className="text-primary font-normal mt-1">R$ {Number(valor || 0).toFixed(2)}</div></div>))}</div>)}
        <div className="mt-2 bg-dark-100 border border-gray-800 rounded-custom p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3"><div className="text-xs text-gray-500 uppercase tracking-wide">FATURAMENTO POR PERÍODO</div><PeriodoSelect value={faturamentoPeriodo} onChange={setFaturamentoPeriodo} /></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
            <div className="bg-dark-200 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">CONCLUÍDOS</div><div className="text-xl font-normal text-green-400">{Number(metricsPeriodoData?.period?.concluidos || 0)}</div></div>
            <div className="bg-dark-200 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">FATURAMENTO</div><div className="text-xl font-normal text-primary">{metricsPeriodoLoading ? '...' : `R$ ${Number(metricsPeriodoData?.period?.faturamento || 0).toFixed(2)}`}</div></div>
            <div className="bg-dark-200 border border-gray-800 rounded-custom p-4"><div className="text-xs text-gray-500 mb-1">MÉDIA POR {counterSingular.toUpperCase()}</div><div className="text-xl font-normal text-white">{metricsPeriodoLoading ? '...' : `R$ ${Number(metricsPeriodoData?.period?.media_por_atendimento || 0).toFixed(2)}`}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
