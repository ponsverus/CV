import React from 'react';
import { X } from 'lucide-react';
import ProfissionalSelect from '../../../components/ProfissionalSelect';

function ServiceFieldRow({ label, children, hint, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-8 py-3 ${last ? '' : 'border-b border-gray-800'}`}>
      <span className="w-[86px] shrink-0 pt-2 text-[13px] text-gray-500">{label}</span>
      <div className="min-w-0 flex-1">
        {children}
        {hint ? <p className="mt-1 text-[11px] text-gray-500">{hint}</p> : null}
      </div>
    </div>
  );
}

const serviceInputClass = 'w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white';

export default function EntregaModal({
  show,
  editingEntregaId,
  modalNewLabel,
  modalEditLabel,
  formEntrega,
  setFormEntrega,
  parceiroProfissional,
  profissionais,
  submittingEntrega,
  onClose,
  onSubmit,
}) {
  if (!show) return null;

  const profissionaisDisponiveis = parceiroProfissional
    ? profissionais.filter((p) => p.id === parceiroProfissional.id)
    : profissionais;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-custom border border-gray-800 bg-dark-100">
        <div className="flex items-center justify-between border-b border-gray-800 px-8 py-6">
          <h3 className="text-2xl font-normal">{editingEntregaId ? modalEditLabel : modalNewLabel}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <ServiceFieldRow label="PROFISSIONAL">
            <ProfissionalSelect
              value={formEntrega.profissional_id}
              onChange={(id) => setFormEntrega({ ...formEntrega, profissional_id: id })}
              profissionais={profissionaisDisponiveis}
              placeholder="Selecione o profissional"
              apenasAtivos={true}
              buttonClassName="w-full flex items-center gap-3 bg-transparent px-0 py-1 text-sm font-normal transition-colors focus:outline-none"
            />
          </ServiceFieldRow>

          <ServiceFieldRow label="NOME">
            <input
              type="text"
              value={formEntrega.nome}
              onChange={(e) => setFormEntrega({ ...formEntrega, nome: e.target.value })}
              className={serviceInputClass}
              placeholder="Nome do servico"
              required
            />
          </ServiceFieldRow>

          <ServiceFieldRow label="DUR. EM MINUTOS">
            <input
              type="number"
              value={formEntrega.duracao_minutos}
              onChange={(e) => setFormEntrega({ ...formEntrega, duracao_minutos: e.target.value })}
              className={serviceInputClass}
              placeholder="Tempo em minutos"
              required
            />
          </ServiceFieldRow>

          <ServiceFieldRow label="VALOR">
            <input
              type="number"
              step="0.01"
              value={formEntrega.preco}
              onChange={(e) => setFormEntrega({ ...formEntrega, preco: e.target.value })}
              className={serviceInputClass}
              placeholder="Valor normal em R$"
              required
            />
          </ServiceFieldRow>

          <ServiceFieldRow label="Oferta" hint="O preco de oferta deve ser menor que o preco normal." last>
            <input
              type="number"
              step="0.01"
              value={formEntrega.preco_promocional}
              onChange={(e) => setFormEntrega({ ...formEntrega, preco_promocional: e.target.value })}
              className={serviceInputClass}
              placeholder="Apenas se houver oferta"
            />
          </ServiceFieldRow>

          <div className="flex items-center gap-3 border-t border-gray-800 px-8 py-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submittingEntrega}
              className="flex-1 rounded-button border border-red-500/30 py-3 text-[12px] uppercase text-red-400 disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={submittingEntrega}
              className={`flex-1 rounded-button bg-gradient-to-r from-primary to-yellow-600 py-3 font-normal uppercase text-black ${submittingEntrega ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {submittingEntrega ? 'SALVANDO...' : 'SALVAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
