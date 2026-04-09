import React from 'react';
import { X } from 'lucide-react';

function StarChar({ active }) {
  return (
    <span
      aria-hidden="true"
      className={`text-2xl leading-none transition-opacity ${active ? 'text-yellow-400 opacity-100' : 'text-yellow-400 opacity-25'}`}
    >
      {'\u2605'}
    </span>
  );
}

export default function DepoimentoModal({
  open,
  onClose,
  styles,
  state,
  actions,
  nomeNegocioLabel,
  profissionais,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`border rounded-custom max-w-md w-full max-h-[90vh] flex flex-col ${styles.modalBg}`}>
        <div className="flex justify-between items-center p-6 pb-4 shrink-0">
          <h3 className={`text-2xl font-normal ${styles.modalTitle}`}>DEPOIMENTO</h3>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <div className="mb-4">
            <div className={`text-sm font-normal mb-2 ${styles.modalLabel}`}>Você está deixando um depoimento sobre</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => actions.setTipo('negocio')} className={`px-4 py-3 rounded-custom border transition-all font-normal ${styles.negocioBtn(state.tipo)}`}>{nomeNegocioLabel}</button>
              <button type="button" onClick={() => actions.setTipo('profissional')} className={`px-4 py-3 rounded-custom border transition-all font-normal ${styles.profissionalBtn(state.tipo)}`}>PROFISSIONAL</button>
            </div>
          </div>
          {state.tipo === 'profissional' && (
            <div className="mb-4">
              <div className={`text-sm font-normal mb-2 ${styles.modalLabel}`}>Qual profissional?</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {profissionais.map((prof) => (
                  <button
                    type="button"
                    key={prof.id}
                    onClick={() => actions.setProfissionalId(prof.id)}
                    className={`w-full text-left px-4 py-3 rounded-custom border transition-all font-normal ${styles.profissionalItem(state.profissionalId === prof.id)}`}
                  >
                    {prof.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-4">
            <div className={`text-sm font-normal mb-2 ${styles.modalLabel}`}>Nota</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => actions.setNota(n)}
                  className="p-0 bg-transparent border-0 shadow-none appearance-none transition-transform hover:scale-105 focus:outline-none"
                  aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  aria-pressed={state.nota === n}
                >
                  <StarChar active={state.nota >= n} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <div className={`text-sm font-normal mb-2 ${styles.modalLabel}`}>Comentário é opcional</div>
            <textarea
              value={state.texto}
              onChange={(e) => actions.setTexto(e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-custom focus:outline-none resize-none font-normal ${styles.textarea}`}
              placeholder="Conte como foi sua experiência..."
            />
          </div>
          <button type="button" onClick={actions.onEnviar} disabled={state.loading || (state.tipo === 'profissional' && !state.profissionalId)} className={`w-full py-3 rounded-button disabled:opacity-60 uppercase font-normal transition-colors ${styles.sendBtn}`}>
            {state.loading ? 'ENVIANDO...' : 'ENVIAR DEPOIMENTO'}
          </button>
          <p className={`text-xs mt-3 font-normal ${styles.hintClass}`}>
            {state.tipo === 'profissional' && !state.profissionalId
              ? 'Selecione um profissional para continuar'
              : 'Somente clientes logados podem deixar depoimentos.'}
          </p>
        </div>
      </div>
    </div>
  );
}
