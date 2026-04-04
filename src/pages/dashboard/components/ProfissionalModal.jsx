import React from 'react';
import { X } from 'lucide-react';
import TimePicker from '../../../components/TimePicker';

export default function ProfissionalModal({
  show,
  formProfissional,
  setFormProfissional,
  weekdays,
  submittingProfissional,
  onClose,
  onSubmit,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-100 border border-gray-800 rounded-custom max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-normal">EDITAR PROFISSIONAL</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><label className="block text-sm mb-2">Nome</label><input type="text" value={formProfissional.nome} onChange={(e) => setFormProfissional({ ...formProfissional, nome: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" required /></div>
          <div><label className="block text-sm mb-2">Como te chamamos?</label><input type="text" value={formProfissional.profissao} onChange={(e) => setFormProfissional({ ...formProfissional, profissao: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" placeholder="Ex: Barbeiro, Manicure..." /></div>
          <div><label className="block text-sm mb-2">Anos de experiência</label><input type="number" value={formProfissional.anos_experiencia} onChange={(e) => setFormProfissional({ ...formProfissional, anos_experiencia: e.target.value })} className="w-full px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm mb-2">Das</label><TimePicker value={formProfissional.horario_inicio} onChange={(v) => setFormProfissional({ ...formProfissional, horario_inicio: v })} step={30} /></div>
            <div><label className="block text-sm mb-2">Até</label><TimePicker value={formProfissional.horario_fim} onChange={(v) => setFormProfissional({ ...formProfissional, horario_fim: v })} step={30} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm mb-2">Almoço (Início)</label><TimePicker value={formProfissional.almoco_inicio} onChange={(v) => setFormProfissional({ ...formProfissional, almoco_inicio: v })} step={15} /></div>
            <div><label className="block text-sm mb-2">Almoço (Fim)</label><TimePicker value={formProfissional.almoco_fim} onChange={(v) => setFormProfissional({ ...formProfissional, almoco_fim: v })} step={15} /></div>
          </div>
          <div>
            <label className="block text-sm mb-2">Dias de trabalho</label>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-7 gap-2">
              {weekdays.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    const dias = formProfissional.dias_trabalho.includes(d.value) ? formProfissional.dias_trabalho.filter((x) => x !== d.value) : [...formProfissional.dias_trabalho, d.value].sort();
                    setFormProfissional({ ...formProfissional, dias_trabalho: dias });
                  }}
                  className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-full border font-normal text-xs transition-all ${formProfissional.dias_trabalho.includes(d.value) ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-dark-200 border-gray-800 text-gray-500'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={submittingProfissional} className={`w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button font-normal uppercase ${submittingProfissional ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {submittingProfissional ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
