import React from 'react';
import { X } from 'lucide-react';
import ProfissionalSelect from '../../../components/ProfissionalSelect';

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

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-normal">{editingEntregaId ? modalEditLabel : modalNewLabel}</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Profissional</label>
            <ProfissionalSelect
              value={formEntrega.profissional_id}
              onChange={(id) => setFormEntrega({ ...formEntrega, profissional_id: id })}
              profissionais={parceiroProfissional ? profissionais.filter((p) => p.id === parceiroProfissional.id) : profissionais}
              placeholder="Selecione"
              apenasAtivos={true}
            />
          </div>
          <div><label className="block text-sm mb-2">Nome</label><input type="text" value={formEntrega.nome} onChange={(e) => setFormEntrega({ ...formEntrega, nome: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
          <div><label className="block text-sm mb-2">Tempo estimado (min)</label><input type="number" value={formEntrega.duracao_minutos} onChange={(e) => setFormEntrega({ ...formEntrega, duracao_minutos: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
          <div><label className="block text-sm mb-2">Preço (R$)</label><input type="number" step="0.01" value={formEntrega.preco} onChange={(e) => setFormEntrega({ ...formEntrega, preco: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
          <div>
            <label className="block text-sm mb-2">Preço de OFERTA (opcional)</label>
            <input type="number" step="0.01" value={formEntrega.preco_promocional} onChange={(e) => setFormEntrega({ ...formEntrega, preco_promocional: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" placeholder="Apenas se houver oferta" />
            <p className="text-[12px] text-gray-500 mt-2">O preço de oferta deve ser menor que o preço normal.</p>
          </div>
          <button type="submit" disabled={submittingEntrega} className={`w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase ${submittingEntrega ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {submittingEntrega ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
