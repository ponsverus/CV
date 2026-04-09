import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEPOIMENTOS_POR_PAGINA = 10;

function Stars5Char({ value = 0, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${v} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ fontSize: size, lineHeight: 1 }}
          className={i <= v ? 'text-primary' : 'text-gray-300'}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function DepoimentosPaginados({ depoimentos, nomeNegocioLabel, isLight }) {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.ceil(depoimentos.length / DEPOIMENTOS_POR_PAGINA);
  const inicio = pagina * DEPOIMENTOS_POR_PAGINA;
  const itens = depoimentos.slice(inicio, inicio + DEPOIMENTOS_POR_PAGINA);
  const navBtnCl = isLight ? 'hover:bg-vcard2 text-vmuted hover:text-vtext' : 'hover:bg-vcard2 text-vsub hover:text-vtext';
  const dotInact = isLight ? 'bg-vborder hover:bg-vsub/40' : 'bg-gray-700 hover:bg-gray-500';
  const comentCl = isLight ? 'text-vsub' : 'text-vsub';

  useEffect(() => {
    const ultimaPaginaValida = Math.max(0, totalPaginas - 1);
    setPagina((prev) => Math.min(prev, ultimaPaginaValida));
  }, [totalPaginas]);

  if (!depoimentos.length) return <p className="text-vmuted font-normal">Nenhum depoimento ainda</p>;

  return (
    <div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {itens.map((dep) => (
          <div key={dep.id} className="mb-4 break-inside-avoid bg-vcard border border-vborder rounded-custom p-4 relative">
            <div className="absolute top-3 right-3">
              {dep.profissional_id && dep.profissionais?.nome ? (
                <span className="inline-block px-1.5 py-0.5 bg-vprimary/10 border border-vprimary/30 rounded-button text-[10px] text-vprimary font-normal uppercase">
                  {dep.profissionais.nome}
                </span>
              ) : (
                <span className="inline-block px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-button text-[10px] text-blue-500 font-normal uppercase">
                  {nomeNegocioLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              {dep.avatarClienteUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-vborder bg-vcard2 shrink-0">
                  <img src={dep.avatarClienteUrl} alt={dep.users?.nome} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-normal shrink-0">
                  {dep.users?.nome?.[0] || 'A'}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-normal">{dep.users?.nome || 'Cliente'}</p>
                <Stars5Char value={dep.nota} size={14} />
              </div>
            </div>
            {dep.comentario && <p className={`text-sm font-normal ${comentCl}`}>{dep.comentario}</p>}
          </div>
        ))}
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0} className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${navBtnCl}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setPagina(i)}
              className={['rounded-full transition-all duration-300', i === pagina ? 'w-4 h-2 bg-vprimary' : `w-2 h-2 ${dotInact}`].join(' ')}
              aria-label={`Página ${i + 1}`}
            />
          ))}
          <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))} disabled={pagina === totalPaginas - 1} className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${navBtnCl}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
