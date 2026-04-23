import React from 'react';
import { X } from 'lucide-react';

function StarChar({ active }) {
  return (
    <span
      aria-hidden="true"
      className={`text-[28px] leading-none transition-opacity ${active ? 'text-primary opacity-100' : 'text-primary opacity-25'}`}
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
  submitLabel = 'ENVIAR DEPOIMENTO',
  showSectionTitles = true,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full max-w-md flex-col rounded-custom border ${styles.modalBg}`}>
        <div className="flex shrink-0 items-center justify-between p-6 pb-4">
          <h3 className={`text-2xl font-normal ${styles.modalTitle}`}>DEPOIMENTO</h3>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="mb-4">
            {showSectionTitles && <div className={`mb-2 text-sm font-normal ${styles.modalLabel}`}>Nota</div>}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => actions.setNota(n)}
                  className="inline-flex h-9 w-9 appearance-none items-center justify-center border-0 bg-transparent p-0 shadow-none transition-transform hover:scale-105 focus:outline-none"
                  aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  aria-pressed={state.nota === n}
                >
                  <StarChar active={state.nota >= n} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            {showSectionTitles && <div className={`mb-2 text-sm font-normal ${styles.modalLabel}`}>Comentário é opcional</div>}
            <textarea
              value={state.texto}
              onChange={(e) => actions.setTexto(e.target.value)}
              rows={4}
              className={`w-full resize-none rounded-custom border px-4 py-3 font-normal focus:outline-none ${styles.textarea}`}
              placeholder="Conte como foi sua experiência..."
            />
          </div>

          <button
            type="button"
            onClick={actions.onEnviar}
            disabled={state.loading}
            className={`w-full rounded-button py-3 font-normal uppercase transition-colors disabled:opacity-60 ${styles.sendBtn}`}
          >
            {state.loading ? 'ENVIANDO...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
