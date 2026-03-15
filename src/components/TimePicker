import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TimePicker
 *
 * Props:
 *   value    — "HH:MM" string
 *   onChange — (value: "HH:MM") => void
 *   label    — string opcional exibido acima
 *   step     — intervalo em minutos (default: 30)
 */
export default function TimePicker({ value, onChange, label, step = 30 }) {
  const [open, setOpen]     = useState(false);
  const [hh, setHh]         = useState('08');
  const [mm, setMm]         = useState('00');
  const containerRef        = useRef(null);
  const hourRef             = useRef(null);
  const minRef              = useRef(null);

  // parse value externo
  useEffect(() => {
    if (!value) return;
    const [h, m] = String(value).split(':');
    if (h !== undefined) setHh(String(h).padStart(2, '0'));
    if (m !== undefined) setMm(String(m).padStart(2, '0'));
  }, [value]);

  // fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        commitAndClose();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, hh, mm]);

  function commitAndClose() {
    onChange(`${hh}:${mm}`);
    setOpen(false);
  }

  function padH(n) { return String(Math.max(0, Math.min(23, n))).padStart(2, '0'); }
  function padM(n) {
    const steps = Math.round(60 / step);
    const idx   = Math.round(n / step);
    return String(((idx % steps) + steps) % steps * step).padStart(2, '0');
  }

  function incH(delta) {
    const cur = parseInt(hh, 10);
    const next = ((cur + delta) + 24) % 24;
    setHh(padH(next));
  }

  function incM(delta) {
    const cur  = parseInt(mm, 10);
    const steps = 60 / step;
    const idx   = Math.round(cur / step);
    const next  = ((idx + delta) % steps + steps) % steps;
    setMm(String(next * step).padStart(2, '0'));
  }

  function handleHhInput(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHh(v);
  }

  function handleMmInput(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMm(v);
  }

  function handleHhBlur() {
    const n = parseInt(hh, 10);
    setHh(padH(isNaN(n) ? 0 : n));
  }

  function handleMmBlur() {
    const n = parseInt(mm, 10);
    const nearest = Math.round(n / step) * step;
    setMm(String(Math.min(59, nearest)).padStart(2, '0'));
  }

  const displayValue = value ? String(value).slice(0, 5) : '—';

  return (
    <div className="relative inline-block" ref={containerRef}>
      {label && <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{label}</div>}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={[
          'flex items-center gap-2 px-3 py-1.5 bg-dark-200 border rounded-full text-sm font-normal transition-colors focus:outline-none',
          open ? 'border-primary/50 text-white' : 'border-gray-800 hover:border-gray-700 text-white',
        ].join(' ')}
      >
        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        <span className="tabular-nums">{displayValue}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 z-50 bg-dark-100 border border-gray-800 rounded-custom shadow-2xl p-5 select-none">
          <div className="flex items-center gap-3">

            {/* horas */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => incH(1)}
                className="p-1 rounded hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <input
                ref={hourRef}
                type="text"
                inputMode="numeric"
                value={hh}
                onChange={handleHhInput}
                onBlur={handleHhBlur}
                maxLength={2}
                className="w-12 h-12 text-center text-2xl font-normal bg-dark-200 border border-gray-800 rounded-custom text-white focus:border-primary/50 focus:outline-none tabular-nums"
              />
              <button
                type="button"
                onClick={() => incH(-1)}
                className="p-1 rounded hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* separador */}
            <span className="text-2xl font-normal text-gray-500 mt-1">:</span>

            {/* minutos */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => incM(1)}
                className="p-1 rounded hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <input
                ref={minRef}
                type="text"
                inputMode="numeric"
                value={mm}
                onChange={handleMmInput}
                onBlur={handleMmBlur}
                maxLength={2}
                className="w-12 h-12 text-center text-2xl font-normal bg-dark-200 border border-gray-800 rounded-custom text-white focus:border-primary/50 focus:outline-none tabular-nums"
              />
              <button
                type="button"
                onClick={() => incM(-1)}
                className="p-1 rounded hover:bg-dark-200 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* atalhos rápidos */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {['00', '15', '30', '45'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMm(m); onChange(`${hh}:${m}`); }}
                className={[
                  'py-1.5 rounded-button text-xs font-normal border transition-colors',
                  mm === m
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-dark-200 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700',
                ].join(' ')}
              >
                :{m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={commitAndClose}
            className="mt-4 w-full py-2 bg-gradient-to-r from-primary to-yellow-600 text-black rounded-button text-sm font-normal uppercase"
          >
            CONFIRMAR
          </button>
        </div>
      )}
    </div>
  );
}
