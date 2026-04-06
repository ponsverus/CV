import React from 'react';

function formatHours(value) {
  return `${Number(value || 0).toFixed(1)}h`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
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

export default function AgendaUtilizacaoBlock({
  souDono,
  metricsUtilizacao,
  metricsUtilizacaoLoading,
}) {
  const data = metricsUtilizacao?.utilizacao || {};
  const porProfissional = Array.isArray(data?.por_profissional) ? data.por_profissional : [];

  return (
    <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-normal uppercase">Utilização da Agenda</h3>
          <div className="text-xs text-gray-500 mt-1">Leitura prevista para {String(data?.amanha || 'amanhã')}</div>
        </div>
        <div className="text-sm text-gray-400">Amanhã</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        <MetricCard
          label="TAXA DE OCUPAÇÃO"
          tone="text-primary"
          value={metricsUtilizacaoLoading ? '...' : formatPercent(data?.taxa_ocupacao)}
        />
        <MetricCard
          label="HORAS OCUPADAS"
          tone="text-green-400"
          value={metricsUtilizacaoLoading ? '...' : formatHours(data?.horas_ocupadas)}
        />
        <MetricCard
          label="HORAS OCIOSAS"
          tone="text-yellow-400"
          value={metricsUtilizacaoLoading ? '...' : formatHours(data?.horas_ociosas)}
        />
        <MetricCard
          label="AGENDAMENTOS VÁLIDOS"
          value={metricsUtilizacaoLoading ? '...' : Number(data?.agendamentos_validos || 0)}
          subtle={metricsUtilizacaoLoading ? null : `${formatHours(data?.horas_disponiveis)} disponíveis`}
        />
        <MetricCard
          label="CANCELADOS"
          tone="text-red-400"
          value={metricsUtilizacaoLoading ? '...' : Number(data?.cancelados || 0)}
        />
      </div>

      {souDono && porProfissional.length > 0 ? (
        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {porProfissional.map((item) => (
            <div key={String(item?.profissional_id || item?.nome)} className="bg-dark-100 border border-gray-800 rounded-custom p-4">
              <div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div>
              <div className="font-normal text-white">{String(item?.nome || 'PROFISSIONAL')}</div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <div className="text-gray-500">Ocupação</div>
                  <div className="text-primary font-normal">{formatPercent(item?.taxa_ocupacao)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Válidos</div>
                  <div className="text-white font-normal">{Number(item?.agendamentos_validos || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ocupadas</div>
                  <div className="text-green-400 font-normal">{formatHours(item?.horas_ocupadas)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ociosas</div>
                  <div className="text-yellow-400 font-normal">{formatHours(item?.horas_ociosas)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
