import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const OPCOES = [
  { value: '7d',  label: 'Últimos 7 dias' },
  { value: '15d', label: 'Últimos 15 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '6m',  label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
  { value: 'all', label: 'Todo o período' },
];

export default function PeriodoSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = OPCOES.find(o => o.value === value) || OPCOES[0];

  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function select(val) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-dark-200 border border-gray-800 rounded-full text-sm font-normal text-white hover:border-primary/50 focus:border-primary/50 focus:outline-none transition-colors min-w-[160px]"
      >
        <span className="flex-1 text-center text-white">{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 bg-dark-100 border border-gray-800 rounded-custom shadow-2xl py-1 min-w-[180px]">
          {OPCOES.map(op => (
            <button
              key={op.value}
              type="button"
              onClick={() => select(op.value)}
              className={[
                'w-full text-left px-4 py-2.5 text-sm font-normal transition-colors',
                op.value === value
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-300 hover:text-white hover:bg-dark-200',
              ].join(' ')}
            >
              {op.value === value && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 mb-0.5" />
              )}
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
