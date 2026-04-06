import React from 'react';

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return 'Sem agenda futura';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
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

export default function FutureBookingsBlock({
  souDono,
  metricsFutureBookings,
  metricsFutureBookingsLoading,
}) {
  const data = metricsFutureBookings?.future_bookings || {};
  const porProfissional = Array.isArray(data?.por_profissional) ? data.por_profissional : [];

  return (
    <div className="bg-dark-200 border border-gray-800 rounded-custom p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-normal uppercase">Receita Futura Projetada</h3>
          <div className="text-xs text-gray-500 mt-1">Receita confirmada para {formatDate(data?.amanha)}</div>
        </div>
        <div className="text-sm text-gray-400">Amanhã</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        <MetricCard
          label="RECEITA PROJETADA"
          tone="text-primary"
          value={metricsFutureBookingsLoading ? '...' : formatCurrency(data?.receita_projetada)}
        />
        <MetricCard
          label="AGENDAMENTOS FUTUROS"
          value={metricsFutureBookingsLoading ? '...' : Number(data?.total_agendamentos || 0)}
        />
        <MetricCard
          label="TICKET MÉDIO FUTURO"
          tone="text-green-400"
          value={metricsFutureBookingsLoading ? '...' : formatCurrency(data?.ticket_medio)}
        />
      </div>

      {souDono && porProfissional.length > 0 ? (
        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {porProfissional.map((item) => (
            <div key={String(item?.profissional_id || item?.nome)} className="bg-dark-100 border border-gray-800 rounded-custom p-4">
              <div className="text-xs text-gray-500 mb-1">PROFISSIONAL</div>
              <div className="font-normal text-white">{String(item?.nome || 'PROFISSIONAL')}</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Receita</span>
                  <span className="text-primary font-normal">{formatCurrency(item?.receita_projetada)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Agendamentos</span>
                  <span className="text-white font-normal">{Number(item?.total_agendamentos || 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
