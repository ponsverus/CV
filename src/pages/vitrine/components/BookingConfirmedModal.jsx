import React from 'react';
import { Calendar } from 'lucide-react';

export default function BookingConfirmedModal({
  open,
  flow,
  confirmadoBg,
  confirmadoTitle,
  confirmadoHora,
  confirmadoData,
  isLight,
  confirmadoSub,
  calendarActionConfig,
  confirmadoAgBtn,
  formatDateBR,
  onClose,
  navigate,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`border rounded-custom max-w-md w-full ${confirmadoBg}`}>
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-10 h-10 text-green-500" /></div>
          <h3 className={`text-2xl font-normal mb-2 ${confirmadoTitle}`}>AGENDADO :)</h3>
          <p className="font-normal mb-1">
            {flow.lastSlot?.label && <span className={`font-normal ${confirmadoHora}`}>{flow.lastSlot.label}</span>}
            {flow.lastSlot?.dataISO && <span className={confirmadoData}> - {formatDateBR(flow.lastSlot.dataISO)}</span>}
          </p>
          <div className={`rounded-custom border p-4 text-left mb-6 ${isLight ? 'bg-[#f8f2eb] border-[#ccb59f]' : 'bg-white/5 border-white/10'}`}>
            <p className={`font-normal text-sm mb-3 ${confirmadoSub}`}>Crie um lembrete no seu celular para assegurar o compromisso.</p>
            <p className={`font-normal text-xs uppercase mb-4 ${isLight ? 'text-[#9a6c4c]' : 'text-[#c7b19c]'}`}>{calendarActionConfig.hint}</p>
            <button onClick={calendarActionConfig.primaryAction} className={`w-full py-4 rounded-button uppercase font-normal transition-colors ${confirmadoAgBtn}`}>
              {calendarActionConfig.primaryLabel}
            </button>
            {calendarActionConfig.secondaryAction && (
              <button
                onClick={calendarActionConfig.secondaryAction}
                className={`w-full py-3 rounded-button uppercase font-normal mt-3 transition-colors border ${isLight ? 'border-[#c6a98d] text-[#4a2f1d] hover:bg-[#ead9c9]' : 'border-white/15 text-white hover:bg-white/8'}`}
              >
                {calendarActionConfig.secondaryLabel}
              </button>
            )}
          </div>
          <button onClick={() => { onClose(); navigate('/minha-area'); }} className="w-full py-3 bg-transparent border border-red-500 text-red-500 rounded-button uppercase font-normal hover:bg-red-500/10 transition-colors">PREFIRO ESQUECER</button>
        </div>
      </div>
    </div>
  );
}
