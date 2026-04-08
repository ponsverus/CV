import React from 'react';

export default function VitrineDepoimentosSection({
  abrirDepoimento,
  isProfessional,
  depBtn,
  DepoimentosPaginados,
  depoimentos,
  nomeNegocioLabel,
  isLight,
}) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-vcard2">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl sm:text-3xl font-normal">Depoimentos</h2>
          <button onClick={abrirDepoimento} disabled={!!isProfessional} className={`px-5 py-2 border rounded-button text-sm transition-all uppercase font-normal ${depBtn}`}>+ Depoimento</button>
        </div>
        <DepoimentosPaginados depoimentos={depoimentos} nomeNegocioLabel={nomeNegocioLabel} isLight={isLight} />
      </div>
    </section>
  );
}
