import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { formatDateBRFromISO } from '../utils';
import { getPublicUrl } from '../api/dashboardApi';

function moneyBR(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '0,00';
  return number.toFixed(2).replace('.', ',');
}

export default function ClientesSection({
  clientes,
  clientesLoading,
  clientesError,
  clientesHasMore,
  clientesLoadingMore,
  loadMoreClientes,
  onAgendarCliente,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-normal">Clientes</h2>
      </div>

      {clientesLoading ? (
        <div className="text-gray-500 text-center py-12">CARREGANDO CLIENTES...</div>
      ) : clientesError ? (
        <div className="border border-red-500/30 bg-red-500/10 text-red-300 rounded-custom p-4 text-sm">
          {clientesError}
        </div>
      ) : clientes.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {clientes.map((cliente) => {
              const avatarUrl = getPublicUrl('avatars', cliente.cliente_avatar_path);
              const nome = String(cliente.cliente_nome || 'Cliente').trim();
              const inicial = nome?.[0]?.toUpperCase() || '?';
              return (
                <div key={cliente.cliente_id} className="bg-dark-200 border border-gray-800 rounded-custom p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 bg-dark-100 flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary text-lg font-normal">{inicial}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-normal text-white truncate">{nome}</h3>
                      <p className="text-xs text-gray-500 uppercase">{Number(cliente.total_agendamentos || 0)} agendamentos</p>
                    </div>
                  </div>

                  <div className="border border-gray-800 rounded-button p-3 mb-4">
                    <div className="text-xs text-gray-500 uppercase mb-2">Último agendamento</div>
                    <div className="text-sm text-white truncate">
                      {formatDateBRFromISO(cliente.ultimo_data)} · {cliente.ultimo_entrega_nome || 'Serviço'} · R$ {moneyBR(cliente.ultimo_valor)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAgendarCliente(cliente)}
                    className="w-full py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    AGENDAR CLIENTE
                  </button>
                </div>
              );
            })}
          </div>

          {clientesHasMore && (
            <button
              type="button"
              onClick={loadMoreClientes}
              disabled={clientesLoadingMore}
              className="mt-4 w-full py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-button text-sm font-normal uppercase disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {clientesLoadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">Nenhum cliente encontrado.</p>
        </div>
      )}
    </div>
  );
}
