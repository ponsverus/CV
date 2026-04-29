import React from 'react';
import {
  computeStatusFromDb,
  formatDateBRFromISO,
  getAgDate,
  getAgInicio,
  getValorAgendamento,
  isCancelStatus,
  isDoneStatus,
} from '../utils';

export default function AgendamentosSection({
  agendamentosAgrupadosPorProfissional,
  hoje,
  confirmarAtendimento,
  cancelarAgendamento,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-normal">AGENDAMENTOS</h2>
      </div>
      {agendamentosAgrupadosPorProfissional.length > 0 ? (
        <div className="space-y-8">
          {agendamentosAgrupadosPorProfissional.map(grupo => (
            <div key={grupo.pid} className="space-y-4">
              <div className="text-sm text-gray-400 uppercase tracking-wide">{grupo.nome}</div>
              <div className="space-y-4">
                {grupo.itens.map(a => {
                  const dataA = getAgDate(a);
                  const isFuturo = dataA > String(hoje || '');
                  const isHoje = dataA === String(hoje || '');
                  const st = computeStatusFromDb(a);
                  const isCancel = isCancelStatus(st);
                  const isDone = isDoneStatus(st);
                  const valorReal = getValorAgendamento(a);
                  return (
                    <div key={a.id} className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-normal text-white truncate">{a.cliente?.nome || '—'}</p>
                        <div className="shrink-0">
                          {isCancel ? <div className="px-3 py-1 rounded-button text-xs bg-red-500/20 text-red-300">CANCELADO</div>
                            : isDone ? <div className="px-3 py-1 rounded-button text-xs bg-green-500/20 text-green-400">CONCLUÍDO</div>
                            : isFuturo ? <div className="px-3 py-1 rounded-button text-xs bg-yellow-500/20 text-yellow-300">FUTURO</div>
                            : <div className="px-3 py-1 rounded-button text-xs bg-blue-500/20 text-blue-400">AGENDADO</div>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-0.5">PROF: {a.profissionais?.nome || '—'}</p>
                      <p className="text-xs text-primary truncate mb-3">{a.entregas?.nome || '—'}</p>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div><div className="text-xs text-gray-500">DATA</div><div className="text-sm">{formatDateBRFromISO(getAgDate(a))}</div></div>
                        <div><div className="text-xs text-gray-500">HORÁRIO</div><div className="text-sm">{getAgInicio(a)}</div></div>
                        <div><div className="text-xs text-gray-500">VALOR</div><div className="text-sm">R$ {Number(valorReal).toFixed(2)}</div></div>
                      </div>
                      {!isDone && !isCancel && (
                        isHoje ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button onClick={() => confirmarAtendimento(a)} className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-button text-sm font-normal uppercase">CONFIRMAR ATENDIMENTO</button>
                            <button onClick={() => cancelarAgendamento(a)} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-button text-sm font-normal uppercase">CANCELAR</button>
                          </div>
                        ) : (
                          <button onClick={() => cancelarAgendamento(a)} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-button text-sm font-normal uppercase">CANCELAR</button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-red-500 text-center py-12">:(</p>}
    </div>
  );
}
