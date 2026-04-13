import React from 'react';
import { X } from 'lucide-react';
import TimePicker from '../../../components/TimePicker';
import { toUpperClean } from '../utils';

function ProfessionalFieldRow({ label, children, last = false }) {
  return (
    <div className={`flex items-start gap-3 px-8 py-3 ${last ? '' : 'border-b border-gray-800'}`}>
      <span className="w-[86px] shrink-0 py-2 text-[13px] leading-5 text-gray-500">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function TimeCell({ label, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] uppercase text-gray-600">{label}</div>
      {children}
    </div>
  );
}

const professionalInputClass = 'w-full bg-transparent px-0 py-2 text-[14px] text-white placeholder-gray-600 outline-none focus:text-white';
const timePickerClass = 'w-full flex items-center justify-between gap-2 bg-transparent px-0 py-1 text-sm font-normal text-white transition-colors focus:outline-none';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-custom border border-gray-800 bg-dark-100">
        <div className="flex items-center justify-between border-b border-gray-800 px-8 py-6">
          <h3 className="text-2xl font-normal">EDITAR PROFISSIONAL</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <ProfessionalFieldRow label="NOME">
            <input
              type="text"
              value={formProfissional.nome}
              onChange={(e) => setFormProfissional({ ...formProfissional, nome: e.target.value })}
              className={professionalInputClass}
              required
            />
          </ProfessionalFieldRow>

          <ProfessionalFieldRow label="PROFI.">
            <input
              type="text"
              value={formProfissional.profissao}
              onChange={(e) => setFormProfissional({ ...formProfissional, profissao: toUpperClean(e.target.value) })}
              className={professionalInputClass}
              placeholder="EX: BARBEIRO, MANICURE"
            />
          </ProfessionalFieldRow>

          <ProfessionalFieldRow label="TEMPO">
            <input
              type="number"
              value={formProfissional.anos_experiencia}
              onChange={(e) => setFormProfissional({ ...formProfissional, anos_experiencia: e.target.value })}
              className={professionalInputClass}
              placeholder="ANOS DE EXPERIÊNCIA"
            />
          </ProfessionalFieldRow>

          <ProfessionalFieldRow label="HORÁRIO">
            <div className="grid grid-cols-2 gap-4">
              <TimeCell label="ABRE">
                <TimePicker
                  value={formProfissional.horario_inicio}
                  onChange={(v) => setFormProfissional({ ...formProfissional, horario_inicio: v })}
                  triggerClassName={timePickerClass}
                />
              </TimeCell>
              <TimeCell label="FECHA">
                <TimePicker
                  value={formProfissional.horario_fim}
                  onChange={(v) => setFormProfissional({ ...formProfissional, horario_fim: v })}
                  triggerClassName={timePickerClass}
                />
              </TimeCell>
            </div>
          </ProfessionalFieldRow>

          <ProfessionalFieldRow label="PAUSA">
            <div className="grid grid-cols-2 gap-4">
              <TimeCell label="INÍCIO">
                <TimePicker
                  value={formProfissional.almoco_inicio}
                  onChange={(v) => setFormProfissional({ ...formProfissional, almoco_inicio: v })}
                  triggerClassName={timePickerClass}
                />
              </TimeCell>
              <TimeCell label="FIM">
                <TimePicker
                  value={formProfissional.almoco_fim}
                  onChange={(v) => setFormProfissional({ ...formProfissional, almoco_fim: v })}
                  triggerClassName={timePickerClass}
                />
              </TimeCell>
            </div>
          </ProfessionalFieldRow>

          <div className="border-b border-gray-800 px-8 py-4">
            <div className="flex flex-wrap gap-2">
              {weekdays.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    const dias = formProfissional.dias_trabalho.includes(d.value)
                      ? formProfissional.dias_trabalho.filter((x) => x !== d.value)
                      : [...formProfissional.dias_trabalho, d.value].sort();
                    setFormProfissional({ ...formProfissional, dias_trabalho: dias });
                  }}
                  className={`min-w-12 rounded-full border px-4 py-1.5 text-xs font-normal transition-all ${formProfissional.dias_trabalho.includes(d.value) ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-transparent border-gray-800 text-gray-500'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-800 px-8 py-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submittingProfissional}
              className="flex-1 rounded-button border border-red-500/30 py-3 text-[12px] font-normal uppercase text-red-400 disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={submittingProfissional}
              className={`flex-1 rounded-button bg-gradient-to-r from-primary to-yellow-600 py-3 font-normal uppercase text-black ${submittingProfissional ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {submittingProfissional ? 'SALVANDO...' : 'SALVAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
