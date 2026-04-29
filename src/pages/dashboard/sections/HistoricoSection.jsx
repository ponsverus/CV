import React from 'react';
import DatePicker from '../../../components/DatePicker';
import {
  computeStatusFromDb,
  formatDateBRFromISO,
  getAgDate,
  getAgInicio,
  getValorAgendamento,
  isCancelStatus,
  isDoneStatus,
} from '../utils';

export default function HistoricoSection({
  historicoData,
  setHistoricoData,
  hoje,
  historicoAgendamentos,
  historicoHasMore,
  loadMoreHistorico,
  historicoLoadingMore,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-normal">HISTÓRICO</h2>
        <DatePicker value={historicoData} onChange={(iso) => setHistoricoData(iso)} todayISO={hoje} />
      </div>
      {historicoAgendamentos.length > 0 ? (
        <div className="space-y-3">
          {historicoAgendamentos.map(a => {
            const st = computeStatusFromDb(a);
            const isCancel = isCancelStatus(st);
            const isDone = isDoneStatus(st);
            const valorReal = getValorAgendamento(a);
            return (
              <div key={a.id} className={`bg-dark-200 border rounded-custom p-4 ${isCancel ? 'border-red-500/30' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-normal text-white truncate">{a.cliente?.nome || '—'}</p>
                  <div className={`px-3 py-1 rounded-button text-xs shrink-0 ${isCancel ? 'bg-red-500/20 border border-red-500/50 text-red-300' : isDone ? 'bg-green-500/20 border border-green-500/50 text-green-300' : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'}`}>
                    {isCancel ? 'CANCELADO' : isDone ? 'CONCLUÍDO' : 'AGENDADO'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mb-0.5">PROF: {a.profissionais?.nome || '—'}</p>
                <p className="text-xs text-primary truncate mb-3">{a.entregas?.nome || '—'}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div><div className="text-xs text-gray-500">DATA</div><div className="text-sm">{formatDateBRFromISO(getAgDate(a))}</div></div>
                  <div><div className="text-xs text-gray-500">HORÁRIO</div><div className="text-sm">{getAgInicio(a)}</div></div>
                  <div><div className="text-xs text-gray-500">VALOR</div><div className="text-sm">R$ {Number(valorReal).toFixed(2)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : <div className="text-gray-500 text-center py-12">...</div>}
      {historicoHasMore && (
        <button onClick={loadMoreHistorico} disabled={historicoLoadingMore} className="mt-4 w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase disabled:opacity-60">
          {historicoLoadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
        </button>
      )}
    </div>
  );
}
